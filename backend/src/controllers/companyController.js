// Get all companies with filters
const getCompanies = async (req, res) => {
  try {
    const { 
      status, 
      type, 
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Search functionality with improved fields
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { 'contactPerson.name': searchRegex },
        { 'contactPerson.email': searchRegex },
        { 'contactPerson.phone': searchRegex },
        { 'contactPerson.designation': searchRegex },
        { 'businessDetails.gstNumber': searchRegex },
        { 'businessDetails.panNumber': searchRegex },
        { 'businessDetails.cinNumber': searchRegex },
        { 'businessDetails.tdsNumber': searchRegex },
        { 'legalDetails.registeredName': searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
        { 'address.country': searchRegex },
        { 'address.pincode': searchRegex }
      ];
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Company.countDocuments(query);

    // Get companies with pagination and sorting
    const companies = await Company.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      companies,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error in getCompanies:', error);
    res.status(500).json({ message: 'Error fetching companies', error: error.message });
  }
}; 