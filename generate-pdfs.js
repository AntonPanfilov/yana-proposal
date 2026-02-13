const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const files = [
    { input: '01-commercial-proposal.html', output: '01-commercial-proposal.pdf' },
    { input: '02-work-plan.html', output: '02-work-plan.pdf' },
    { input: '03-technical-spec.html', output: '03-technical-spec.pdf' },
];

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const file of files) {
        const page = await browser.newPage();
        const filePath = path.resolve(__dirname, file.input);

        // Use file:// URL instead of setContent for better font/resource loading
        await page.goto(`file://${filePath}`, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for fonts to load
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(r => setTimeout(r, 2000));

        // Hide the nav bar for PDF
        await page.evaluate(() => {
            const nav = document.querySelector('.portal-nav');
            if (nav) nav.style.display = 'none';
        });

        const outputPath = path.resolve(__dirname, file.output);
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        });
        const stats = fs.statSync(outputPath);
        console.log(`✅ ${file.output} (${Math.round(stats.size / 1024)} KB)`);
        await page.close();
    }

    await browser.close();
    console.log('\n🎉 All PDFs generated!');
})();
