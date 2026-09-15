#!/usr/bin/perl
# =============================================================
# mt-apply-v2.pl — デザイン v2 の MT テンプレートを本番 MT に反映する（サーバー上で実行）
#
#   perl /tmp/v2/mt-apply-v2.pl            # DRY-RUN（対象と差分件数だけ表示）
#   perl /tmp/v2/mt-apply-v2.pl --apply    # テンプレート更新
#   perl /tmp/v2/mt-apply-v2.pl --apply --rebuild   # 更新 + index テンプレートの強制再構築
#
# 前提: /tmp/v2/ に以下を scp 済み（scripts/redesign-v2/mt-apply-v2.sh が行う）
#   index-html.mtml / prefecture-page.mtml / jobs-latest-json.mtml / jobs-summary-json.mtml
#   jobs-child-json.mtml（求人一覧 JSON schema 2）/ jobs-child-kw-json.mtml（キーワード索引）
#
# 反映内容:
#   1. 親サイト(blog_id=1) の index テンプレート「トップページ」(index.html) を差し替え
#   2. 全子ブログの index テンプレート (index.html) を prefecture-page.mtml に差し替え
#      （先頭の <mt:SetVar prefecture_id / prefecture_name> は各ブログの site_path / name から生成）
#   3. 親サイトに「新着求人JSON」(data/jobs-latest.json) と「求人件数JSON」(data/jobs-summary.json) を
#      作成（既存なら本文のみ更新）。公開設定は「定期的に再構築」60分
#   2b. 全子ブログの「求人JSON生成テンプレート」(../data/jobs/{id}.json) を schema 2 に差し替え
#   2c. 全子ブログに「求人キーワードJSON生成テンプレート」(../data/jobs/{id}.kw.json) を作成
#   4. --rebuild 時: 親サイトの index テンプレート全部 + 各子ブログの index.html を Force 再構築
#      （求人詳細などアーカイブは再構築しない: テンプレート変更なし・CSS 後勝ちで対応）
# =============================================================
use strict;
use warnings;
use utf8;
# MT_DIR は $0 の場所から推定されるため、/tmp 等から実行すると addons（カスタムフィールド）が読めない
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
use MT::Blog;
use MT::Template;
use MT::WeblogPublisher;

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $APPLY   = grep { $_ eq '--apply' } @ARGV;
my $REBUILD = grep { $_ eq '--rebuild' } @ARGV;
my $DIR     = '/tmp/v2';

my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
# スタンドアロン実行ではカスタムフィールドのテンプレートタグ（EntryData* 等）が登録されないため明示的に登録する
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;

sub slurp {
    my ($f) = @_;
    open my $fh, '<:encoding(UTF-8)', $f or die "cannot read $f: $!";
    local $/;
    my $t = <$fh>;
    close $fh;
    $t =~ s/\r\n/\n/g;
    return $t;
}

my $index_tpl   = slurp("$DIR/index-html.mtml");
my $pref_tpl    = slurp("$DIR/prefecture-page.mtml");
my $latest_tpl  = slurp("$DIR/jobs-latest-json.mtml");
my $summary_tpl = slurp("$DIR/jobs-summary-json.mtml");
my $jobs_tpl    = slurp("$DIR/jobs-child-json.mtml");
my $kw_tpl      = slurp("$DIR/jobs-child-kw-json.mtml");

print "Mode: " . ($APPLY ? 'APPLY' : 'DRY-RUN') . ($REBUILD ? ' + REBUILD' : '') . "\n\n";

my $publisher = MT::WeblogPublisher->new;
my @rebuild;   # [blog_id, template]

# ---- 1. 親サイト トップページ ----
my ($top) = MT::Template->load({ blog_id => 1, type => 'index', outfile => 'index.html' });
die "parent index template not found" unless $top;
printf "[1] parent index.html (template_id=%d) : %s\n", $top->id, ($top->text eq $index_tpl ? 'unchanged' : 'UPDATE');
if ($APPLY && $top->text ne $index_tpl) {
    $top->text($index_tpl);
    $top->save or die $top->errstr;
}
push @rebuild, [1, $top];

# ---- 2. 子ブログ ----
my @blogs = MT::Blog->load({ class => 'blog', parent_id => 1 });
printf "[2] child blogs: %d\n", scalar @blogs;
for my $blog (sort { $a->id <=> $b->id } @blogs) {
    my ($t) = MT::Template->load({ blog_id => $blog->id, type => 'index', outfile => 'index.html' });
    unless ($t) { printf "   [%d] %s : index.html template NOT FOUND (skip)\n", $blog->id, $blog->name; next; }
    my $id = $blog->site_path // '';
    $id =~ s{[/\\]+$}{};
    $id =~ s{^.*[/\\]}{};
    my $name = $blog->name;
    unless ($id =~ /^[a-z]+$/) { printf "   [%d] %s : cannot derive prefecture_id from site_path '%s' (skip)\n", $blog->id, $name, $blog->site_path; next; }
    my $text = $pref_tpl;
    $text =~ s/<mt:SetVar name="prefecture_id" value="[^"]*">/<mt:SetVar name="prefecture_id" value="$id">/ or die "SetVar prefecture_id not found in template";
    $text =~ s/<mt:SetVar name="prefecture_name" value="[^"]*">/<mt:SetVar name="prefecture_name" value="$name">/ or die "SetVar prefecture_name not found in template";
    my $changed = $t->text ne $text;
    printf "   [%d] %-6s %s (template_id=%d) : %s\n", $blog->id, $name, $id, $t->id, ($changed ? 'UPDATE' : 'unchanged');
    if ($APPLY && $changed) {
        $t->text($text);
        $t->save or die $t->errstr;
    }
    push @rebuild, [$blog->id, $t];

    # 2b. 求人一覧 JSON（schema 2）: 既存「求人JSON生成テンプレート」(../data/jobs/{id}.json) を差し替え
    my $jtext = $jobs_tpl;
    $jtext =~ s/<mt:SetVar name="prefecture_id" value="[^"]*">/<mt:SetVar name="prefecture_id" value="$id">/ or die "SetVar not found in jobs-child-json";
    my ($jt) = MT::Template->load({ blog_id => $blog->id, type => 'index', outfile => "../data/jobs/$id.json" });
    if ($jt) {
        my $jc = $jt->text ne $jtext;
        printf "        jobs json (template_id=%d) : %s
", $jt->id, ($jc ? 'UPDATE (schema 2)' : 'unchanged');
        if ($APPLY && $jc) { $jt->text($jtext); $jt->save or die $jt->errstr; }
        push @rebuild, [$blog->id, $jt];
    } else {
        printf "        jobs json : template for ../data/jobs/%s.json NOT FOUND (skip)
", $id;
    }
    # 2c. キーワード索引 JSON: 無ければ作成（保存時に再構築される通常の index テンプレ）
    my $ktext = $kw_tpl;
    $ktext =~ s/<mt:SetVar name="prefecture_id" value="[^"]*">/<mt:SetVar name="prefecture_id" value="$id">/ or die "SetVar not found in jobs-child-kw-json";
    my ($kt) = MT::Template->load({ blog_id => $blog->id, type => 'index', outfile => "../data/jobs/$id.kw.json" });
    if ($kt) {
        my $kc = $kt->text ne $ktext;
        printf "        kw json   (template_id=%d) : %s
", $kt->id, ($kc ? 'UPDATE' : 'unchanged');
        if ($APPLY && $kc) { $kt->text($ktext); $kt->save or die $kt->errstr; }
    } else {
        printf "        kw json   : CREATE ../data/jobs/%s.kw.json
", $id;
        if ($APPLY) {
            $kt = MT::Template->new;
            $kt->blog_id($blog->id); $kt->type('index'); $kt->name('求人キーワードJSON生成テンプレート');
            $kt->outfile("../data/jobs/$id.kw.json"); $kt->text($ktext); $kt->rebuild_me(1); $kt->build_type(1);
            $kt->save or die $kt->errstr;
        }
    }
    push @rebuild, [$blog->id, $kt] if $kt;
}

# ---- 3. 新規 JSON フィード ----
for my $spec (
    [ '新着求人JSON', 'data/jobs-latest.json',  $latest_tpl ],
    [ '求人件数JSON', 'data/jobs-summary.json', $summary_tpl ],
) {
    my ($name, $outfile, $text) = @$spec;
    my ($t) = MT::Template->load({ blog_id => 1, type => 'index', outfile => $outfile });
    if ($t) {
        printf "[3] %s (%s) : exists template_id=%d : %s\n", $name, $outfile, $t->id, ($t->text eq $text ? 'unchanged' : 'UPDATE');
        if ($APPLY && $t->text ne $text) { $t->text($text); $t->save or die $t->errstr; }
    } else {
        printf "[3] %s (%s) : CREATE (build_type=5 scheduled / 60min)\n", $name, $outfile;
        if ($APPLY) {
            $t = MT::Template->new;
            $t->blog_id(1);
            $t->type('index');
            $t->name($name);
            $t->outfile($outfile);
            $t->text($text);
            $t->rebuild_me(1);
            $t->build_type(5);        # MT::PublishOption::SCHEDULED（定期的に再構築）
            $t->build_interval(60);   # 分
            $t->save or die $t->errstr;
        }
    }
    push @rebuild, [1, $t] if $t;
}

# ---- 4. 再構築 ----
if ($REBUILD) {
    die "--rebuild requires --apply" unless $APPLY;
    print "\n[4] rebuild index templates (Force=1)\n";
    my ($ok, $ng) = (0, 0);
    for my $r (@rebuild) {
        my ($bid, $t) = @$r;
        eval { $publisher->rebuild_indexes(BlogID => $bid, Template => $t, Force => 1) or die $publisher->errstr; };
        if ($@) { printf "   NG blog=%d %s : %s\n", $bid, $t->name, $@; $ng++; }
        else    { $ok++; }
    }
    printf "   done: ok=%d ng=%d\n", $ok, $ng;
}

print "\n" . ($APPLY ? 'APPLIED' : 'DRY-RUN complete (no changes)') . "\n";
