import { google } from 'googleapis';
const auth = new google.auth.GoogleAuth({ keyFile: 'docs/tensyokudodesyo-1dcb1b08e015.json', scopes: ['https://www.googleapis.com/auth/webmasters'] });
const sc = google.searchconsole({ version: 'v1', auth });
await sc.sitemaps.submit({ siteUrl: 'sc-domain:tensyokudodesyo.com', feedpath: 'https://www.tensyokudodesyo.com/sitemap.xml' });
console.log('GSC sitemap submit: OK');
