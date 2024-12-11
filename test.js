const puppeteer = require('puppeteer');


function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time)
    });
}

async function clickAddProduct(page, position) {
    const productComponent = await page.$(`div.product:nth-child(${position})`);
    const productNameComponent = await productComponent.$(`div.product-info a span`);
    const productName = await page.evaluate(el => el.textContent, productNameComponent);

    const priceComponent = await productComponent.$('.final-price span');
    const price = await page.evaluate(el => Number(el.textContent.split(' ')[0]), priceComponent);

    const buyBtn = await productComponent.$('a.product-buy');
    await buyBtn.click();

    await delay(500);

    return {productComponent, buyBtn, productName, price};
}

jest.setTimeout(70 * 1000)

describe('Amital cart tests', () => {
    let page;
    let browser;

    beforeAll(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
    });

    beforeEach(async () => {
        browser = await puppeteer.launch();
        page = await browser.newPage();
    });

    afterEach(async () => {
        await browser.close();
    });

    afterAll(async () => {
        await page.close();
    });

    test('Card button changes', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        const { productName, price, productComponent, buyBtn } = await clickAddProduct(page, 1);
        const buyBtnText = await page.evaluate(el => el.textContent, buyBtn);
        await delay(1000);
        expect(buyBtnText).toContain('Оформить');
    })

    test('Card popup changes', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        const { productName, price, productComponent, buyBtn } = await clickAddProduct(page, 1);

        const cartPopup = await page.$('div.cart-popup .total_cart');
        const count = await page.evaluate(el => Number(el.textContent), cartPopup);

        expect(count).toBe(1);
    })

    test('Card popup changes (3 items)', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        await clickAddProduct(page, 1);
        await clickAddProduct(page, 2);
        await clickAddProduct(page, 3);

        const totalCart = await page.$('div.cart-popup .total_cart');
        const count = await page.evaluate(el => Number(el.textContent), totalCart);

        expect(count).toBe(3);
    })

    test('Remove 1 item', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        await clickAddProduct(page, 3);

        const cartPopup = await page.$('div.cart-popup');

        await cartPopup.click();
        await page.waitForSelector('div.cart_header', { visible: true })

        const removeBtn = await page.$('a.remove.desc');
        await removeBtn.click();
        await delay(1000);

        const closeBtn = await page.$('span.close_me');
        await closeBtn.click();
        await delay(1000);

        const totalCart = await page.$('div.cart-popup .total_cart');
        const count = await page.evaluate(el => Number(el.textContent), totalCart);

        expect(count).toBe(0);
    })

    test('Remove multiple items', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        await clickAddProduct(page, 1);
        await clickAddProduct(page, 2);
        await clickAddProduct(page, 3);

        const cartPopup = await page.$('div.cart-popup');

        await cartPopup.click();
        await page.waitForSelector('div.cart_header', { visible: true })

        const removeBtns = await page.$$('a.remove.desc');
        for (const btn of removeBtns) {
            await btn.click();
        }

        const closeBtn = await page.$('span.close_me');
        await closeBtn.click();
        await delay(1000);

        const totalCart = await page.$('div.cart-popup .total_cart');
        const count = await page.evaluate(el => Number(el.textContent), totalCart);

        expect(count).toBe(0);
    })

    test('add 1 item & check price', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        const { productName, price } = await clickAddProduct(page, 3);

        const cartPopup = await page.$('div.cart-popup');

        await cartPopup.click();
        await page.waitForSelector('div.cart_header', { visible: true })

        const name = await page.$('.cart_content .pname a');
        const nameText = await page.evaluate(el => el.textContent, name);
        expect(nameText).toBe(productName);

        const priceComponent = await page.$('.cart_footer tr:nth-child(2) td:nth-child(2)');
        const actualPrice = await page.evaluate(el => Number(el.textContent.split(' ')[0]), priceComponent);
        expect(price).toBe(actualPrice);
    });

    test('add multiple items & check price', async () => {
        await page.goto('https://amital.ru/Hudozhyestvyennaya-lityeratura-c1');
        const { productName: productName1, price: price1 } = await clickAddProduct(page, 1);
        const { productName: productName2, price: price2 } = await clickAddProduct(page, 2);
        const { productName: productName3, price: price3 } = await clickAddProduct(page, 3);

        const productsNames = [productName1, productName2, productName3];
        const price = price1 + price2 + price3;

        const cartPopup = await page.$('div.cart-popup');

        await cartPopup.click();
        await page.waitForSelector('div.cart_header', { visible: true })

        const actualNames = [];
        const nameComponents = await page.$$('.cart_content .pname a');
        for (const nameComponent of nameComponents) {
            const name = await page.evaluate(el => el.textContent, nameComponent);
            actualNames.push(name);
        }
        expect(actualNames.sort()).toEqual(productsNames.sort());

        const priceComponent = await page.$('.cart_footer tr:nth-child(2) td:nth-child(2)');
        const actualPrice = await page.evaluate(el => Number(el.textContent.split(' ')[0]), priceComponent);

        expect(actualPrice).toBe(price);
    });
});
