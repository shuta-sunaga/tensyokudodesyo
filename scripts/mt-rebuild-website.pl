#!/usr/bin/perl
# 親サイト（website, blog_id=1）の index テンプレートと全アーカイブ（コンテンツタイプ含む）を Force=1 で再構築する。
# mt-rebuild-all-force.pl は MT::Blog->load() が class=blog しか返さないため親サイトを再構築しない。その補完。
#   scp → ssh "cd /var/www/mt && perl /tmp/v2/mt-rebuild-website.pl [blog_id]"
use strict;
use warnings;
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
binmode(STDOUT, ':encoding(UTF-8)');
my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;
require MT::Blog;
require MT::Template;
require MT::WeblogPublisher;

my $bid = $ARGV[0] || 1;
my $blog = MT::Blog->load($bid) or die "blog $bid not found";
print "[$bid] " . $blog->name . " (" . $blog->class . ")\n";
my $publisher = MT::WeblogPublisher->new;
my ($ok, $ng) = (0, 0);
for my $t (MT::Template->load({ blog_id => $bid, type => 'index' })) {
    my $r = eval { $publisher->rebuild_indexes(BlogID => $bid, Template => $t, Force => 1) };
    if ($@ || !$r) { print "  NG index " . $t->name . ": " . ($@ || $publisher->errstr || '?') . "\n"; $ng++; }
    else { $ok++; }
}
print "  index templates: ok=$ok ng=$ng\n";
my $r = eval { $publisher->rebuild(BlogID => $bid, NoIndexes => 1, BuildIndexes => 0, Force => 1) };
print "  entry archives: " . (($@ || !$r) ? "NG " . ($@ || $publisher->errstr || '?') : 'ok') . "\n";
# コンテンツタイプ（インタビュー・企業・ノウハウの詳細）は rebuild() で更新されないため個別に再構築する
require MT::ContentData;
require MT::ContentPublisher;   # MT7+: コンテンツデータの再構築は ContentPublisher
my $cpub = MT::ContentPublisher->new;
my ($cok, $cng) = (0, 0);
for my $cd (MT::ContentData->load({ blog_id => $bid })) {
    my $r = eval { $cpub->rebuild_content_data(ContentData => $cd, Force => 1, BuildDependencies => 0) };
    if ($@ || !$r) { print "  NG content_data id=" . $cd->id . ": " . ($@ || $cpub->errstr || "?") . "
"; $cng++; }
    else { $cok++; }
}
print "  content data: ok=$cok ng=$cng
";
