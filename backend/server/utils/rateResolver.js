const LabourSiteRate = require('../models/LabourSiteRate');
const { pool } = require('../config/database');

const getLabourRate = async (labour_id, site_id) => {
  // Pehle site-specific rate check karo
  const siteRate = await LabourSiteRate.getRate(labour_id, site_id);
  
  if (siteRate) {
    return {
      company_rate_8hr: siteRate.company_rate_8hr,
      company_ot_rate_hr: siteRate.company_ot_rate_hr,
      our_rate_8hr: siteRate.our_rate_8hr,
      our_ot_rate_hr: siteRate.our_ot_rate_hr
    };
  }
  
  // Fallback to category default rate
  const [rows] = await pool.query(
    `SELECT lc.company_rate_8hr, lc.company_ot_rate_hr,
            lc.our_rate_8hr, lc.our_ot_rate_hr
     FROM labour l
     JOIN labour_categories lc ON l.category_id = lc.id
     WHERE l.id = ?`,
    [labour_id]
  );
  
  return rows[0];
};

module.exports = { getLabourRate };