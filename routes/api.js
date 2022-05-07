const { Router } = require("express");
const puppeteer = require("puppeteer");
const config = require("../config/config");
const {
  TOTAL_RECORDS_DOM_SELECTOR,
  CATEGORY_TAG_TO_DATA_MAP,
} = require("../constants/totalRecords.constants");
const {
  STATE_RECORDS_TABLE_HEADER_ROW_SELCTOR,
  STATE_RECORDS_TABLE_BODY_ROW_SELCTOR,
} = require("../constants/stateRecords.constants");
const {
  CATEGORIES,
  SCRAP_INTERVAL,
  DB_KEYS,
} = require("../constants/app.constants");
const db = require("quick.db");

const router = Router();

const getLastUpdatedTime = () => {
  //TODO: Sync it with scraped time from mohfw instead
  return Math.floor(Date.now() / 1000);
};

const getScrapedTotalRecords = async () => {
  try {
    console.log("Scraping total records");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(config.covidDataPageUrl);
    await page.waitForSelector(TOTAL_RECORDS_DOM_SELECTOR);
    const records = await page.evaluate(
      (TOTAL_RECORDS_DOM_SELECTOR, CATEGORY_TAG_TO_DATA_MAP) => {
        const result = [];
        document.body
          .querySelectorAll(TOTAL_RECORDS_DOM_SELECTOR)
          .forEach((element) => {
            let [categoryTag, numberDataDom] =
              element.querySelectorAll(".mob-hide");
            categoryTag = categoryTag.textContent.trim().split(" ")[0];
            let numberDataString = numberDataDom.textContent.trim();
            const diffMultiplier = numberDataDom
              .querySelector("span > i")
              .classList.contains("fa-arrow-up")
              ? 1
              : -1;
            let [count, prevCountDiff] = numberDataString
              .substring(0, numberDataString.indexOf(")"))
              .split("(");
            count = parseInt(count);
            prevCountDiff = parseInt(prevCountDiff) * diffMultiplier;
            result.push({
              ...CATEGORY_TAG_TO_DATA_MAP[categoryTag],
              count,
              prevCountDiff,
            });
          });
        return result;
      },
      TOTAL_RECORDS_DOM_SELECTOR,
      CATEGORY_TAG_TO_DATA_MAP
    );
    browser.close();
    return records;
  } catch {
    return [];
  }
};

const getScrapedStateRecords = async () => {
  try {
    console.log("Scraping state records");
    const categories = ["Name", ...Object.values(CATEGORIES)];
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
    });
    const page = await browser.newPage();
    await page.goto(config.covidDataPageUrl);
    await page.waitForSelector(STATE_RECORDS_TABLE_HEADER_ROW_SELCTOR);
    const { categoriesDataRowIndex, totalCols } = await page.evaluate(
      (STATE_RECORDS_TABLE_HEADER_ROW_SELCTOR, categories) => {
        const result = [];
        let currentCol = 0;
        document.body
          .querySelectorAll(STATE_RECORDS_TABLE_HEADER_ROW_SELCTOR)
          .forEach((element) => {
            categories.every((category) => {
              if (element.textContent.indexOf(category) !== -1) {
                result.push({ category, index: currentCol });
                return false;
              } else return true;
            });
            currentCol += element.colSpan;
          });
        return { categoriesDataRowIndex: result, totalCols: currentCol };
      },
      STATE_RECORDS_TABLE_HEADER_ROW_SELCTOR,
      categories
    );
    await page.waitForSelector(STATE_RECORDS_TABLE_BODY_ROW_SELCTOR);
    const records = await page.evaluate(
      (
        STATE_RECORDS_TABLE_BODY_ROW_SELCTOR,
        categoriesDataRowIndex,
        totalCols
      ) => {
        const result = [];
        let tableRows = document.body.querySelectorAll(
          STATE_RECORDS_TABLE_BODY_ROW_SELCTOR
        );
        tableRows.forEach((row, index) => {
          const rowData = Array.from(row.querySelectorAll("td"));
          if (rowData.length < totalCols) return;
          const categoriesData = categoriesDataRowIndex.reduce(
            (prev, { category, index: rowIndex }) => ({
              ...prev,
              [category.toLowerCase()]: rowData[rowIndex].textContent.trim(),
            }),
            {}
          );
          result.push({
            state_code: index,
            ...categoriesData,
          });
        });
        return result;
      },
      STATE_RECORDS_TABLE_BODY_ROW_SELCTOR,
      categoriesDataRowIndex,
      totalCols
    );
    browser.close();
    return records;
  } catch {
    // TODO: error handling
    return [];
  }
};

(async function scrapeData() {
  Promise.allSettled([getScrapedTotalRecords(), getScrapedStateRecords()])
    .then(async (res) => {
      const [{ value: totalRecords }, { value: stateRecords }] = res;
      try {
        console.log("total records length", totalRecords.length);
        console.log("state records length", stateRecords.length);
        Promise.allSettled([
          db.set(DB_KEYS.TOTAL_RECORDS, totalRecords),
          db.set(DB_KEYS.STATE_RECORDS, stateRecords),
        ]).then(() => console.log("DB Updated"));
      } catch {
        return;
      }
    })
    .finally(() => {
      setTimeout(scrapeData, SCRAP_INTERVAL);
    });
})();

router.get("/totalRecords", async (req, res, next) => {
  const totalRecords = await db.get(DB_KEYS.TOTAL_RECORDS);
  res.json({
    records: totalRecords ?? [],
    lastUpdatedTime: getLastUpdatedTime(),
  });
});

router.get("/stateRecords", async (req, res, next) => {
  const stateRecords = await db.get(DB_KEYS.STATE_RECORDS);
  res.json({
    records: stateRecords ?? [],
    lastUpdatedTime: getLastUpdatedTime(),
  });
});

module.exports = router;
