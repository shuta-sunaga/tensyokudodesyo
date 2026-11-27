#!/usr/bin/perl
# =============================================================
# mt-rebuild-job-feeds.pl — 親サイトの求人フィード JSON だけを Force 再構築する
#
#   data/jobs-latest.json（トップ「新着求人」）と data/jobs-summary.json（都道府県別件数）
#
#   scp scripts/mt-rebuild-job-feeds.pl ec2-user@HOST:/tmp/
#   ssh ... "cd /var/www/mt && perl /tmp/mt-rebuild-job-feeds.pl"          # 状態表示のみ
#   ssh ... "cd /var/www/mt && perl /tmp/mt-rebuild-job-feeds.pl --rebuild" # 再構築
#
# テンプレート本文・公開設定は変更しない（再構築のみ）。
# =============================================================
use strict;
use warnings;
use utf8;
# MT_DIR は $0 の場所から推定されるため、/tmp 等から実行すると addons（カスタムフィールド）が読めない
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
use MT::Template;
use MT::WeblogPublisher;

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $REBUILD = grep { $_ eq '--rebuild' } @ARGV;

my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;

my $publisher = MT::WeblogPublisher->new;
my ($ok, $ng) = (0, 0);
for my $outfile ('data/jobs-latest.json', 'data/jobs-summary.json') {
    my ($t) = MT::Template->load({ blog_id => 1, type => 'index', outfile => $outfile });
    unless ($t) { print "NOT FOUND: $outfile\n"; $ng++; next; }
    printf "%s : template_id=%d name=%s build_type=%s build_interval=%s rebuild_me=%s modified_on=%s\n",
        $outfile, $t->id, $t->name, $t->build_type // '', $t->build_interval // '', $t->rebuild_me // '', $t->modified_on // '';
    next unless $REBUILD;
    eval { $publisher->rebuild_indexes(BlogID => 1, Template => $t, Force => 1) or die $publisher->errstr; };
    if ($@) { print "   NG: $@\n"; $ng++; } else { print "   rebuilt\n"; $ok++; }
}
printf "%s: ok=%d ng=%d\n", ($REBUILD ? 'REBUILD' : 'STATUS ONLY'), $ok, $ng;
exit($ng ? 1 : 0);
