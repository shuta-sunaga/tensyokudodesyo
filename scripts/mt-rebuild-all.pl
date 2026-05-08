#!/usr/bin/perl
# 全 blog を一括再構築する
# 実行: cd /var/www/mt && perl /tmp/mt-rebuild-all.pl

use strict;
use warnings;
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';

use MT;
my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";

require MT::Blog;
require MT::WeblogPublisher;

my @blogs = MT::Blog->load();
print "対象 blog: " . scalar(@blogs) . " 件\n\n";

my $publisher = MT::WeblogPublisher->new;
my ($ok, $ng) = (0, 0);

for my $blog (@blogs) {
    my $id   = $blog->id;
    my $name = $blog->name || '(no name)';
    print "[$id] $name ... ";
    eval {
        $publisher->rebuild(
            BlogID => $id,
            NoStatic => 0,
        );
    };
    if ($@) {
        print "ERROR: $@\n";
        $ng++;
    } else {
        print "OK\n";
        $ok++;
    }
}

print "\n=== 結果 ===\n";
print "成功: $ok / 失敗: $ng\n";
