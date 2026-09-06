const SiteCategoryRate = require('../models/SiteCategoryRate');
const { pool } = require('../config/database');

const getLabourRate = async (labour_id, site_id) => {
  // Pehle labour ki category nikalo
  const [labourRows] = await pool.query(
    'SELECT category_id FROM labour WHERE id = ?',
    [labour_id]
  );
  if (!labourRows.length) throw new Error('Labour not found');
  const category_id = labourRows[0].category_id;

  // Site-category rate check karo
  const siteRate = await SiteCategoryRate.getRate(site_id, category_id);
  if (siteRate) {
    return {
      company_rate_8hr: siteRate.company_rate_8hr,
      company_ot_rate_hr: siteRate.company_ot_rate_hr,
      our_rate_8hr: siteRate.our_rate_8hr,
      our_ot_rate_hr: siteRate.our_ot_rate_hr
    };
  }

  // Fallback to category default
  const [catRows] = await pool.query(
    `SELECT company_rate_8hr, company_ot_rate_hr, our_rate_8hr, our_ot_rate_hr
     FROM labour_categories WHERE id = ?`,
    [category_id]
  );
  if (!catRows.length) throw new Error('Category rate not found');
  return catRows[0];
};

module.exports = { getLabourRate };