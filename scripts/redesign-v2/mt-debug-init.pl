#!/usr/bin/perl
# MT のスタンドアロン初期化でアドオン（Commercial.pack / CustomFields）が読めているかを確認する診断用
use strict;
use warnings;
# MT_DIR は $0 の場所から推定されるため、/tmp 等から実行すると addons（カスタムフィールド）が読めない
BEGIN { $ENV{MT_HOME} = '/var/www/mt'; }
use lib '/var/www/mt/lib';
use lib '/var/www/mt/extlib';
use MT;
my $mt = MT->new(Config => '/var/www/mt/mt-config.cgi') or die "MT init failed: " . MT->errstr;
print "component(commercial) = ", (MT->component('commercial') ? 'ok' : 'undef'), "\n";
print "PluginPath: ", join(', ', @{ MT->config->PluginPath || [] }), "\n";
print "AddonPath: ", (eval { MT->config->AddonPath } // '(n/a)'), "\n";
print "has tag EntryDatacompany: ", (MT->registry('tags', 'function', 'EntryDatacompany') ? 'yes' : 'no'), "\n";
print "has tag EntryTitle: ", (MT->registry('tags', 'function', 'EntryTitle') ? 'yes' : 'no'), "\n";
# 2 回目: init_app コールバックを明示的に流す
eval { MT->run_callbacks('init_app', $mt); };
print "run_callbacks(init_app): ", ($@ ? "ERROR $@" : 'ok'), "\n";
print "after init_app - has tag EntryDatacompany: ", (MT->registry('tags', 'function', 'EntryDatacompany') ? 'yes' : 'no'), "\n";
