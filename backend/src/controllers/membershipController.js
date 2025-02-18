import dbPool from '../config/dbConfig.js';

// Helper function for standardized responses
const sendResponse = (res, status, message, data = null, error = null) => {
  res.status(status).json({ status, message, data, error });
};

// Get all memberships
export const getAllMemberships = async (req, res) => {
  try {
    const [results] = await dbPool.query('SELECT * FROM memberships');
    sendResponse(res, 200, 'Memberships retrieved successfully', results);
  } catch (err) {
    sendResponse(res, 500, 'Error retrieving memberships', null, err.message);
  }
};

// Get membership by unique_key
export const getMembershipByUniqueKey = async (req, res) => {
  const { unique_key } = req.params;
  try {
    const [results] = await dbPool.query('SELECT * FROM memberships WHERE unique_key = ?', [unique_key]);
    if (results.length === 0) {
      return sendResponse(res, 404, 'Membership not found');
    }
    sendResponse(res, 200, 'Membership retrieved successfully', results[0]);
  } catch (err) {
    sendResponse(res, 500, 'Error retrieving membership', null, err.message);
  }
};

// Create a new membership
export const createMembership = async (req, res) => {
  const { unique_key, name, email, expired_time } = req.body;
  try {
    const [results] = await dbPool.query(
      'INSERT INTO memberships (unique_key, name, email, expired_time) VALUES (?, ?, ?, ?)',
      [unique_key, name, email, expired_time]
    );
    sendResponse(res, 201, 'Membership created successfully', {
      id: results.insertId,
      unique_key,
    });
  } catch (err) {
    sendResponse(res, 500, 'Error creating membership', null, err.message);
  }
};

// Update a membership
export const updateMembership = async (req, res) => {
  const { unique_key } = req.params;
  const { name, email } = req.body;
  try {
    const [results] = await dbPool.query(
      'UPDATE memberships SET name = ?, email = ? WHERE unique_key = ?',
      [name, email, unique_key]
    );
    if (results.affectedRows === 0) {
      return sendResponse(res, 404, 'Membership not found');
    }
    sendResponse(res, 200, 'Membership updated successfully');
  } catch (err) {
    sendResponse(res, 500, 'Error updating membership', null, err.message);
  }
};

// Delete a membership
export const deleteMembership = async (req, res) => {
  const { unique_key } = req.params;
  try {
    const [results] = await dbPool.query('DELETE FROM memberships WHERE unique_key = ?', [unique_key]);
    if (results.affectedRows === 0) {
      return sendResponse(res, 404, 'Membership not found');
    }
    sendResponse(res, 200, 'Membership deleted successfully');
  } catch (err) {
    sendResponse(res, 500, 'Error deleting membership', null, err.message);
  }
};

// Delete all memberships
export const deleteAllMemberships = async (req, res) => {
  const apiKey = req.headers['api-key'];
  if (apiKey !== process.env.DEV_API_KEY) {
    return sendResponse(res, 403, 'Forbidden: Invalid API Key');
  }
  try {
    const [results] = await dbPool.query('DELETE FROM memberships');
    sendResponse(res, 200, 'All memberships deleted successfully', {
      affectedRows: results.affectedRows,
    });
  } catch (err) {
    sendResponse(res, 500, 'Error deleting all memberships', null, err.message);
  }
};

// Patch update membership
export const patchMembership = async (req, res) => {
  const { unique_key } = req.params;
  const { name, email, expired_time } = req.body;

  let updateQuery = 'UPDATE memberships SET ';
  const queryParams = [];

  if (name) {
    updateQuery += 'name = ?, ';
    queryParams.push(name);
  }
  if (email) {
    updateQuery += 'email = ?, ';
    queryParams.push(email);
  }
  if (expired_time !== undefined) {
    updateQuery += 'expired_time = ?, ';
    queryParams.push(expired_time);
  }
  updateQuery = updateQuery.slice(0, -2) + ' WHERE unique_key = ?';
  queryParams.push(unique_key);

  try {
    const [results] = await dbPool.query(updateQuery, queryParams);
    if (results.affectedRows === 0) {
      return sendResponse(res, 404, 'Membership not found');
    }
    sendResponse(res, 200, 'Membership successfully patched');
  } catch (err) {
    sendResponse(res, 500, 'Error patching membership', null, err.message);
  }
};
//#region validate membership
// Validate membership - from launcher
export const validateMembership = async (req, res) => {
  const { unique_key } = req.body;

  if (!unique_key) {
    return res.status(400).json({
      message: 'unique_key is required',
      data: null,
      error: null,
    });
  }

  try {
    // Menjalankan query ke database
    const [results] = await dbPool.query(
      'SELECT expired_status, tiktok_account_type, tiktok_account, game_list, expired_time FROM memberships WHERE unique_key = ?',
      [unique_key]
    );

    if (results.length === 0) {
      return res.status(404).json({
        message: 'Membership not found',
        data: null,
        error: null,
      });
    }

    // Mengambil hasil query
    const membershipData = results[0];

    // Memeriksa apakah expired_status adalah "ACTIVE"
    if (membershipData.expired_status !== "ACTIVE") {
      return res.status(403).json({
        message: 'Membership is not active',
        data: null,
        error: null,
      });
    }

    // Parse `game_list` dari string ke objek JSON
    membershipData.game_list = JSON.parse(membershipData.game_list);

    // Kirim respons sukses
    return res.status(200).json({
      message: 'Membership validated successfully',
      data: membershipData,
      error: null,
    });
  } catch (err) {
    // Menangani error
    return res.status(500).json({
      message: 'Error validating membership',
      data: null,
      error: err.message,
    });
  }
};

// export default validateMembership;

// Method untuk memvalidasi unique_key dan mengambil expired_time jika expired_status adalah ACTIVE - in game
export const validateMembershipInGame = async (req, res) => {
  const { unique_key } = req.params; // Ambil unique_key dari parameter URL

  try {
    // Query untuk mengambil expired_status dan expired_time berdasarkan unique_key
    const [results] = await dbPool.query(
      'SELECT expired_status, expired_time FROM memberships WHERE unique_key = ?',
      [unique_key]
    );

    // Periksa apakah data ditemukan
    if (results.length === 0) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    const membership = results[0];

    // Periksa apakah expired_status adalah ACTIVE
    if (membership.expired_status === 'ACTIVE') {
      return res.status(200).json({ expired_time: membership.expired_time });
    }

    // Jika expired_status bukan ACTIVE, kembalikan pesan EXPIRED
    return res.status(403).json({ message: 'Membership is expired' });

  } catch (err) {
    // Tangani error
    res.status(500).json({ message: 'Error validating membership', error: err.message });
  }
};
//#endregion
