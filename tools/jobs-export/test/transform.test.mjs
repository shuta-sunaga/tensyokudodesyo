/**
 * 整形ロジック + Shift_JIS エンコードのスモークテスト (creds 不要)
 *   実行: node test/transform.test.mjs
 */
import assert from 'node:assert';
import iconv from 'iconv-lite';
import { buildRows, rowsToCsvString, extractCity, prefectureCore, matchesPrefectureCore } from '../transform.mjs';
import { encodeShiftJIS } from '../csv-shiftjis.mjs';

let pass = 0;
const t = (name, fn) => { fn(); console.log('  ✓ ' + name); pass++; };

// extractCity
t('extractCity: 括弧内住所から県+市を抽出', () => {
  assert.equal(extractCity('浜松三方町店（静岡県浜松市中央区東三方町222-3）'), '静岡県浜松市');
});
t('extractCity: 括弧外住所', () => {
  assert.equal(extractCity('静岡県磐田市見付4353-1（磐田店）'), '静岡県磐田市');
});
t('extractCity: 東京特別区', () => {
  assert.equal(extractCity('東京都渋谷区道玄坂1-2-3'), '東京都渋谷区');
});
t('extractCity: 抽出不能は要相談', () => {
  assert.equal(extractCity(''), '要相談');
});

// prefectureCore
t('prefectureCore: 大阪府→大阪 / 東京都→東京 / 北海道→北海', () => {
  assert.equal(prefectureCore('大阪府'), '大阪');
  assert.equal(prefectureCore('東京都'), '東京');
  assert.equal(prefectureCore('埼玉県'), '埼玉');
  assert.equal(prefectureCore('北海道'), '北海');
});

// matchesPrefectureCore
t('matchesPref: サフィックス有無どちらもマッチ', () => {
  assert.ok(matchesPrefectureCore('東京都', '東京'));
  assert.ok(matchesPrefectureCore('東京', '東京'));
});
t('matchesPref: 京都で東京都を誤検出しない（衝突回避）', () => {
  assert.ok(matchesPrefectureCore('京都府', '京都'));
  assert.equal(matchesPrefectureCore('東京都', '京都'), false);
});
t('matchesPref: 複数県混在（、と , 区切り）', () => {
  assert.ok(matchesPrefectureCore('大阪府,京都府,兵庫県', '京都'));
  assert.ok(matchesPrefectureCore('福岡県、東京都', '東京'));
  assert.equal(matchesPrefectureCore('大阪府,兵庫県', '京都'), false);
});

// buildRows: サンプル求人1件
const sample = [{
  'id': '1',
  '求人票ID': 'SJ250065',
  '求人名': '【営業職】法人営業／未経験歓迎',
  '採用企業名': '株式会社テクノソリューション',
  '雇用形態': '正社員',
  '職種（大分類）': '営業(法人)',
  '応募条件': '特になし',
  '歓迎条件': '営業経験者歓迎',
  '仕事内容': 'BtoB営業を担当していただきます。',
  '勤務地詳細': '本社（静岡県浜松市中央区東三方町222-3）',
  '勤務時間': '9:00〜18:00',
  '休日詳細': '土日祝',
  '選考フロー': '書類→面接2回',
  '年収下限': '3500000',
  '年収上限': '5000000',
  '給与詳細': '月給250000円〜',
  '福利厚生詳細': '社会保険完備',
  '諸手当': '通勤手当（上限30000円）',
  '賞与詳細': '年2回（前年実績4ヶ月）',
  '本社：郵便場号': '〒430-0925',
  '本社：都道府県': '静岡県',
  '本社：住所詳細': '浜松市中央区東三方町222-3',
  '建物': '①号館',
  '従業員数': '120',
  '設立年月': '2010年4月',
  '会社概要': 'システム開発を手がける㈱です。髙橋が代表。',
  'ポジションのポイント1': '未経験から成長できる環境',
  'ポジションのポイント2': '充実した研修制度',
  'ポジションのポイント3': '',
  '会社HP_URL': 'https://example.com',
}];

const rows = buildRows(sample, '2026-06-30 12:00:00');
const r = rows[0];

t('basename = 求人票ID', () => assert.equal(r.basename, 'SJ250065'));
t('class=entry / author=admin', () => { assert.equal(r.class, 'entry'); assert.equal(r.author, 'admin'); });
t('salary: 下限~上限 + カンマ', () => assert.equal(r.salary, '3,500,000~5,000,000'));
t('requirements: 特になし除去 + 改行結合', () => assert.equal(r.requirements, '営業経験者歓迎'));
t('benefits: 福利厚生 + 諸手当 改行結合', () => assert.ok(r.benefits.includes('社会保険完備') && r.benefits.includes('通勤手当')));
t('city: 勤務地から抽出', () => assert.equal(r.city, '静岡県浜松市'));
t('category: 半角括弧→全角', () => assert.equal(r.category, '営業（法人）'));
t('company_address: 結合 + 丸囲み数字①→(1)', () => assert.equal(r.company_address, '〒430-0925 静岡県 浜松市中央区東三方町222-3 (1)号館'));
t('established: テキスト保持', () => assert.equal(r.established, '2010年4月'));
t('勤務時間の全角チルダ→半角', () => assert.equal(r.work_hours, '9:00~18:00'));
t('会社概要: ㈱→(株), 髙→高 に置換', () => assert.ok(r.business_content.includes('(株)') && r.business_content.includes('高橋')));

// CSV + Shift_JIS
const csv = rowsToCsvString(rows);
t('CSVヘッダーが44列', () => assert.equal(csv.split('\r\n')[0].split(',').length, 44));

const { buffer, unmapped } = encodeShiftJIS(csv);
t('Shift_JIS Buffer が生成される', () => assert.ok(Buffer.isBuffer(buffer) && buffer.length > 0));
t('Shift_JIS→デコードで会社名が復元できる', () => {
  const decoded = iconv.decode(buffer, 'Shift_JIS');
  assert.ok(decoded.includes('株式会社テクノソリューション'));
});
t('建物の丸囲み数字①が(1)に変換される', () => {
  const decoded = iconv.decode(buffer, 'Shift_JIS');
  assert.ok(decoded.includes('(1)号館'));
});

console.log(`\n${pass} tests passed. unmapped chars: ${unmapped.length ? unmapped.join(',') : 'none'}`);
