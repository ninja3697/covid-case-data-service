const { CARD_COLORS, EMOTIONS, CATEGORIES } = require("./app.constants");

const TOTAL_RECORDS_DOM_SELECTOR =
  "#site-dashboard > div > div > div:nth-child(1) > div.site-stats-count > ul > li";

const CATEGORY_TAG_TO_DATA_MAP = {
  [CATEGORIES.ACTIVE]: {
    id: "active",
    name: "Active Cases",
    cardColor: CARD_COLORS.PRIMARY,
    emotion: EMOTIONS.FAILURE,
  },
  [CATEGORIES.DISCHARGED]: {
    id: "discharged",
    name: "Recovered",
    cardColor: CARD_COLORS.SUCCESS,
    emotion: EMOTIONS.SUCCESS,
  },
  [CATEGORIES.DEATHS]: {
    id: "deaths",
    name: "Deaths",
    cardColor: CARD_COLORS.DANGER,
    emotion: EMOTIONS.FAILURE,
  },
};

module.exports = {
  TOTAL_RECORDS_DOM_SELECTOR,
  CATEGORY_TAG_TO_DATA_MAP,
};
