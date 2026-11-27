#!/usr/bin/perl
# =============================================================
# mt-unpublish-jobs.pl — 指定した求人票ID（basename）の記事を「未公開（下書き）」に戻す
#
#   scp scripts/mt-unpublish-jobs.pl ec2-user@HOST:/tmp/
#   ssh ... "cd /var/www/mt && perl /tmp/mt-unpublish-jobs.pl SJ2537849 SJ2538866 ..."          # DRY-RUN
#   ssh ... "cd /var/www/mt && perl /tmp/mt-unpublish-jobs.pl --apply SJ2537849 SJ2538866 ..."  # 実行
#   ssh ... "cd /var/www/mt && perl /tmp/mt-unpublish-jobs.pl --republish SJ2537849"            # 元に戻す（公開）
#
# --apply 時: status を HOLD(1) にして保存 → 個別ページ（{pref}/jobs/{ID}.html）を削除 →
#             該当子ブログの index テンプレート（求人JSON・kw JSON・トップ）を Force 再構築 →
#             親サイトの jobs-latest.json / jobs-summary.json を Force 再構築
# 記事そのものは削除しない（管理画面から再公開できる）。
# =============================================================
use strict;
use warnings;
use utf8;
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
use MT::Blog;
use MT::Entry;
use MT::Template;
use MT::WeblogPublisher;

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $APPLY     = grep { $_ eq '--apply' } @ARGV;
my $REPUBLISH = grep { $_ eq '--republish' } @ARGV;
my @IDS       = grep { !/^--/ } @ARGV;
die "usage: perl mt-unpublish-jobs.pl [--apply|--republish] SJxxxxxxx ...\n" unless @IDS;

my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;

my $publisher = MT::WeblogPublisher->new;
my $HOLD = MT::Entry::HOLD();
my $RELEASE = MT::Entry::RELEASE();
my $target = $REPUBLISH ? $RELEASE : $HOLD;
my %blogs;
my ($done, $skip, $ng) = (0, 0, 0);

for my $id (@IDS) {
    my @es = MT::Entry->load({ basename => $id });
    @es = MT::Entry->load({ basename => lc $id }) unless @es;
    unless (@es) { print "NOT FOUND  $id\n"; $ng++; next; }
    if (@es > 1) { printf "AMBIGUOUS  %s (%d entries: blogs %s)\n", $id, scalar(@es), join(',', map { $_->blog_id } @es); $ng++; next; }
    my $e = $es[0];
    my $blog = MT::Blog->load($e->blog_id);
    printf "%-10s entry_id=%d blog=%d(%s) status=%d  %s\n", $id, $e->id, $e->blog_id, ($blog ? $blog->name : '?'), $e->status, substr($e->title // '', 0, 40);
    if ($e->status == $target) { print "   already in target status, skip\n"; $skip++; next; }
    next unless ($APPLY || $REPUBLISH);
    eval {
        if (!$REPUBLISH) {
            # 公開ファイルを先に消す（status 変更後は fileinfo が引けなくなる場合があるため）
            $publisher->remove_entry_archive_file(Entry => $e, ArchiveType => 'Individual');
        }
        $e->status($target);
        $e->save or die $e->errstr;
        if ($REPUBLISH) {
            $publisher->rebuild_entry(Entry => $e, BuildDependencies => 0, Force => 1) or die $publisher->errstr;
        }
    };
    if ($@) { print "   NG: $@\n"; $ng++; next; }
    print "   -> status=$target\n";
    $blogs{ $e->blog_id } = 1;
    $done++;
}

if (%blogs) {
    print "\nrebuild index templates of affected blogs\n";
    for my $bid (sort { $a <=> $b } keys %blogs) {
        eval { $publisher->rebuild_indexes(BlogID => $bid, Force => 1) or die $publisher->errstr; };
        printf "   blog=%d %s\n", $bid, ($@ ? "NG: $@" : 'OK');
        $ng++ if $@;
    }
    print "rebuild parent job feeds\n";
    for my $outfile ('data/jobs-latest.json', 'data/jobs-summary.json') {
        my ($t) = MT::Template->load({ blog_id => 1, type => 'index', outfile => $outfile });
        next unless $t;
        eval { $publisher->rebuild_indexes(BlogID => 1, Template => $t, Force => 1) or die $publisher->errstr; };
        printf "   %s %s\n", $outfile, ($@ ? "NG: $@" : 'OK');
        $ng++ if $@;
    }
}
printf "\n%s: changed=%d skipped=%d ng=%d\n", (($APPLY || $REPUBLISH) ? 'APPLIED' : 'DRY-RUN'), $done, $skip, $ng;
exit($ng ? 1 : 0);
