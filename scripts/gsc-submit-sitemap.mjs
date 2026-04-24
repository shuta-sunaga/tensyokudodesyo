import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    keyFile: 'docs/tensyokudodesyo-1dcb1b08e015.json',
    scopes: ['https://www.googleapis.com/auth/webmasters']
});

const searchconsole = google.searchconsole({ version: 'v1', auth });

try {
    await searchconsole.sitemaps.submit({
        siteUrl: 'sc-domain:tensyokudodesyo.com',
        feedpath: 'https://www.tensyokudodesyo.com/sitemap.xml'
    });
    console.log('OK: sitemap submitted');
} catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
}
