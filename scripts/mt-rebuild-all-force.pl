#!/usr/bin/perl
# 全 blog の全テンプレを Force=1 で強制再構築
use strict;
use warnings;
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
require MT::Blog;
require MT::Template;
require MT::WeblogPublisher;

my @blogs = MT::Blog->load();
print "対象 blog: " . scalar(@blogs) . " 件\n\n";

my $publisher = MT::WeblogPublisher->new;
my ($ok, $ng) = (0, 0);

for my $blog (@blogs) {
    my $bid = $blog->id;
    print "[$bid] " . ($blog->name // '(no name)') . " ... ";
    my $blog_ng = 0;
    # index テンプレを Force 再構築
    my @indexes = MT::Template->load({blog_id=>$bid, type=>'index'});
    for my $t (@indexes) {
        eval { $publisher->rebuild_indexes(BlogID=>$bid, Template=>$t, Force=>1); };
        if ($@) { $blog_ng++; }
    }
    # アーカイブ系も rebuild_archives で
    eval {
        $publisher->rebuild(
            BlogID => $bid,
            NoStatic => 0,
            NoIndexes => 1, # index は既に Force 済
            BuildIndexes => 0,
        );
    };
    if ($@) { $blog_ng++; }
    if ($blog_ng) { print "NG ($blog_ng errors)\n"; $ng++; }
    else          { print "OK\n"; $ok++; }
}

print "\n=== 結果 ===\n";
print "成功: $ok / 失敗: $ng\n";
