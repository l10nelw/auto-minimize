const ALL_DEFAULTS = {
  enabled: false,
  limit: 12,
};

export const set = dict => browser.storage.local.set(dict);
export const get = async key => (await browser.storage.local.get({ [key]: ALL_DEFAULTS[key] }))[key];
export const getAll = () => browser.storage.local.get(ALL_DEFAULTS);