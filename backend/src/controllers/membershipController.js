import dbPool from '../config/dbConfig.js';

// Get all memberships
export const getAllMemberships = async (req, res) => {
  try {
    const [results] = await dbPool.query('SELECT * FROM memberships'); // Query data
    res.status(200).json(results); // Berhasil mengembalikan data
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving memberships', error: err });
  }
};

// Get membership by unique_key
export const getMembershipByUniqueKey = async (req, res) => {
  const { unique_key } = req.params; // Ambil unique_key dari parameter
  try {
    const [results] = await dbPool.query('SELECT * FROM memberships WHERE unique_key = ?', [unique_key]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Membership not found' }); // Data tidak ditemukan
    }
    res.status(200).json(results[0]); // Kirim data
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving membership', error: err });
  }
};

// Create a new membership
export const createMembership = async (req, res) => {
  const { unique_key, name, email, expired_time} = req.body;
  try {
    const [results] = await dbPool.query(
      'INSERT INTO memberships (unique_key, name, email, expired_time) VALUES (?, ?, ?, ?)',
      [unique_key, name, email, expired_time]
    );

    res.status(201).json({
      message: 'Membership created successfully',
      id: results.insertId,
      unique_key: unique_key, // Sertakan unique_key dalam respons
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating membership', error: err.message });
  }
};

// Update a membership
export const updateMembership = async (req, res) => {
  const { unique_key } = req.params; // Ambil unique_key
  const { name, email } = req.body; // Ambil data dari body
  try {
    const [results] = await dbPool.query(
      'UPDATE memberships SET name = ?, email = ? WHERE unique_key = ?',
      [name, email, unique_key]
    );
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Membership not found' }); // Tidak ada baris yang diperbarui
    }
    res.status(200).json({ message: 'Membership updated' }); // Berhasil diperbarui
  } catch (err) {
    res.status(500).json({ message: 'Error updating membership', error: err });
  }
};

// Delete a membership
export const deleteMembership = async (req, res) => {
  const { unique_key } = req.params; // Ambil unique_key
  try {
    const [results] = await dbPool.query('DELETE FROM memberships WHERE unique_key = ?', [unique_key]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Membership not found' }); // Tidak ada baris yang dihapus
    }
    res.status(200).json({ message: 'Membership deleted' }); // Sukses dihapus
  } catch (err) {
    res.status(500).json({ message: 'Error deleting membership', error: err });
  }
};
export const deleteAllMemberships = async (req, res) => {
  const apiKey = req.headers['api-key']; // Ambil API Key dari header

  // Periksa apakah API Key cocok dengan yang di file .env
  if (apiKey !== process.env.DEV_API_KEY) {
    return res.status(403).json({ message: 'Forbidden: Invalid API Key' }); // Jika API Key tidak cocok
  }

  try {
    const [results] = await dbPool.query('DELETE FROM memberships'); // Query untuk menghapus semua data
    res.status(200).json({
      message: 'All memberships deleted successfully',
      affectedRows: results.affectedRows, // Menampilkan jumlah baris yang dihapus
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting all memberships', error: err });
  }
};
// Patch update membership (Partial Update)
export const patchMembership = async (req, res) => {
  const { unique_key } = req.params; // Ambil unique_key dari parameter URL
  const { name, email, expired_time } = req.body; // Ambil data name, email, expired_time dari body

  // Buat query dinamis untuk mengupdate hanya kolom yang dikirimkan
  let updateQuery = 'UPDATE memberships SET ';
  const queryParams = [];

  if (name) {
    updateQuery += 'name = ?, ';
    queryParams.push(name); // Menambahkan name ke parameter query
  }

  if (email) {
    updateQuery += 'email = ?, ';
    queryParams.push(email); // Menambahkan email ke parameter query
  }

  if (expired_time !== undefined) { // Memeriksa apakah expired_time ada dalam request
    updateQuery += 'expired_time = ?, ';
    queryParams.push(expired_time); // Menambahkan expired_time ke parameter query
  }

  // Hapus koma dan spasi berlebih di akhir query jika ada
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ' WHERE unique_key = ?';
  queryParams.push(unique_key); // Menambahkan unique_key ke parameter query untuk kondisi WHERE

  try {
    const [results] = await dbPool.query(updateQuery, queryParams);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Membership not found' }); // Data tidak ditemukan
    }
    res.status(200).json({ message: 'Membership successfully patched' }); // Berhasil diupdate
  } catch (err) {
    res.status(500).json({ message: 'Error patching membership', error: err });
  }
};

// --------- region validation ---------//
// Validate membership by unique_key with detailed error messages
export const validateMembership = async (req, res) => {
  const { unique_key } = req.body; // Ambil unique_key dari body request

  if (!unique_key) {
    return res.status(400).json({ message: 'unique_key is required' });
  }

  try {
    const [results] = await dbPool.query(
      'SELECT status, access, game_list FROM memberships WHERE unique_key = ?',
      [unique_key]
    );

    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'Membership not found', 
        error: `No membership found with unique_key: ${unique_key}` 
      });
    }

    const { status, access, game_list } = results[0];
    res.status(200).json({
      message: 'Membership validated successfully',
      status,
      access,
      game_list
    });
  } catch (err) {
    res.status(500).json({ message: 'Error validating membership', error: err.message });
  }
};

// --------- endregion validation ---------//
