#!/usr/bin/perl
# 全 blog を一括再構築する
# 実行: cd /var/www/mt && perl /tmp/mt-rebuild-all.pl

use strict;
use warnings;
# MT_DIR は $0 の場所から推定されるため、/tmp 等から実行すると addons（カスタムフィールド）が読めない
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';

use MT;
my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed";
# スタンドアロン実行ではカスタムフィールドのテンプレートタグ（EntryData* 等）が登録されないため明示的に登録する
use lib '/var/www/mt/addons/Commercial.pack/lib';
require CustomFields::Util;
eval { CustomFields::Util::load_meta_fields(); CustomFields::Util::install_field_tags(); };
warn "CustomFields init: $@" if $@;

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
