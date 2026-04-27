import { google } from 'googleapis';

(async () => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'docs/tensyokudodesyo-1dcb1b08e015.json',
            scopes: ['https://www.googleapis.com/auth/webmasters']
        });
        const searchconsole = google.searchconsole({ version: 'v1', auth });
        await searchconsole.sitemaps.submit({
            siteUrl: 'sc-domain:tensyokudodesyo.com',
            feedpath: 'https://www.tensyokudodesyo.com/sitemap.xml'
        });
        console.log('GSC sitemap submitted: OK');
    } catch (e) {
        console.error('GSC submit failed:', e.message);
        process.exitCode = 1;
    }
})();
