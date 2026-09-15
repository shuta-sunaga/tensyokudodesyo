#!/usr/bin/perl
# 全 blog の全エントリ (個別アーカイブ) を Force=1 で強制再構築
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
require MT::Entry;
require MT::WeblogPublisher;

my @blogs = MT::Blog->load();
my $publisher = MT::WeblogPublisher->new;
my $total = 0;
my $errors = 0;

for my $blog (@blogs) {
    my $bid = $blog->id;
    next if $bid == 1; # 親ブログは個別アーカイブを使ってない想定
    my @entries = MT::Entry->load({blog_id=>$bid, status=>2}); # 2=published
    next if !@entries;
    print "[$bid] " . ($blog->name // '?') . " : " . scalar(@entries) . " entries ... ";
    my $err = 0;
    for my $e (@entries) {
        eval { $publisher->rebuild_entry(Entry=>$e, BuildDependencies=>0, Force=>1); };
        if ($@) { $err++; $errors++; }
        $total++;
    }
    print $err ? "$err NG / " . scalar(@entries) . " OK\n" : "OK\n";
}

print "\n=== 結果 ===\n";
print "再構築: $total entries / エラー: $errors\n";
