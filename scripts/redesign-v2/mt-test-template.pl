#!/usr/bin/perl
# =============================================================
# mt-test-template.pl — MT テンプレートの構文・出力を本番 MT で安全に検証する（サーバー上で実行）
#
#   perl /tmp/v2/mt-test-template.pl <blog_id> <mtml_path> <outfile> [--keep] [--head N]
#
# 指定ブログに一時的な index テンプレート（名前 v2test-<epoch>）を作成 → Force 再構築 →
# 出力ファイルの先頭 N バイトと JSON パース結果を表示 → テンプレートと出力ファイルを削除する。
# 本番の既存テンプレートには触れない。--keep を付けると削除しない。
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
use File::Spec;

binmode STDOUT, ':encoding(UTF-8)';
my ($blog_id, $file, $outfile, @rest) = @ARGV;
die "usage: $0 <blog_id> <mtml_path> <outfile> [--keep] [--head N]\n" unless $blog_id && $file && $outfile;
my $keep = grep { $_ eq '--keep' } @rest;
my $head = 1500;
for my $i (0 .. $#rest) { $head = $rest[$i + 1] if $rest[$i] eq '--head' && $rest[$i + 1]; }

my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
# スタンドアロン実行ではカスタムフィールドのテンプレートタグ（EntryData* 等）が登録されないため明示的に登録する
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;
my $blog = MT::Blog->load($blog_id) or die "blog $blog_id not found";
open my $fh, '<:encoding(UTF-8)', $file or die "cannot read $file: $!";
my $text = do { local $/; <$fh> };
close $fh;
$text =~ s/\r\n/\n/g;

my $t = MT::Template->new;
$t->blog_id($blog_id);
$t->type('index');
$t->name('v2test-' . time);
$t->outfile($outfile);
$t->text($text);
$t->rebuild_me(0);
$t->build_type(2);   # 手動
$t->save or die $t->errstr;
printf "created template id=%d in blog %d (%s), outfile=%s\n", $t->id, $blog_id, $blog->name, $outfile;

my $publisher = MT::WeblogPublisher->new;
my $t0 = time;
my $ok = eval { $publisher->rebuild_indexes(BlogID => $blog_id, Template => $t, Force => 1) };
my $err = $@ || ($ok ? '' : ($publisher->errstr || 'unknown error'));
printf "rebuild: %s (%ds)\n", ($err ? "ERROR: $err" : 'ok'), time - $t0;

my $path = File::Spec->rel2abs($outfile, $blog->site_path);
if (-f $path) {
    my $size = -s $path;
    open my $of, '<:encoding(UTF-8)', $path or die $!;
    my $out = do { local $/; <$of> };
    close $of;
    printf "output: %s (%d bytes)\n", $path, $size;
    my $parsed = eval { require JSON; JSON->new->utf8(0)->decode($out) };
    if ($@) { print "JSON parse: ERROR $@\n"; }
    else {
        my $n = ref $parsed eq 'HASH' ? (ref $parsed->{jobs} eq 'ARRAY' ? scalar @{ $parsed->{jobs} } : scalar keys %$parsed) : 0;
        print "JSON parse: ok ($n entries)\n";
    }
    print "----- head -----\n", substr($out, 0, $head), "\n----- /head -----\n";
    unlink $path unless $keep;
} else {
    print "output file not found: $path\n";
}
unless ($keep) { $t->remove; print "template removed\n"; }
