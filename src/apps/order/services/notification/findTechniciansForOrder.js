const UserModel = require('../../../auth/models/user');
const { normalizeCity } = require('../../../../libs/normalizeCity');

async function findTechniciansForOrder(order, serviceType, debug = false) {
  try {
    const normalizedCity = normalizeCity(order.address.city);
    if (debug) {
      console.log('Normalized city for query:', normalizedCity);
    }

    const query = {
      role: 'technician',
      services: serviceType._id,
      'address.city': { $regex: `^${normalizedCity}$`, $options: 'i' },
      address: { $exists: true },
    };

    if (debug) {
      // Log debug để kiểm tra database
      const allTechnicians = await UserModel.find({ role: 'technician' })
        .select('name address.city services fcmToken')
        .lean();
      console.log(
        'All technicians in database:',
        allTechnicians.map((t) => ({
          _id: t._id,
          name: t.name,
          city: t.address?.city || 'No city',
          services: t.services || [],
          hasFcmToken: !!t.fcmToken,
        }))
      );

      const techniciansByRole = await UserModel.find({ role: 'technician' })
        .select('name')
        .lean();
      console.log('Technicians with role=technician:', techniciansByRole.length);

      const techniciansByService = await UserModel.find({
        role: 'technician',
        services: serviceType._id,
      })
        .select('name services')
        .lean();
      console.log(`Technicians with service ${serviceType._id}:`, techniciansByService.length);

      const techniciansByCity = await UserModel.find({
        role: 'technician',
        'address.city': { $regex: `^${normalizedCity}$`, $options: 'i' },
      })
        .select('name address.city')
        .lean();
      console.log(`Technicians in city ${normalizedCity}:`, techniciansByCity.length);
    }

    const technicians = await UserModel.find(query)
      .select('name fcmToken address.city')
      .lean();

    if (debug) {
      console.log(`Found ${technicians.length} technicians in ${normalizedCity} for service type ${serviceType.label}`);
      console.log(
        'Technicians found:',
        technicians.map((t) => ({
          _id: t._id,
          name: t.name,
          city: t.address?.city || 'No city',
          fcmToken: t.fcmToken ? 'Has token' : 'No token',
        }))
      );

      if (technicians.length === 0) {
        console.log('No technicians found. Check conditions:', {
          role: 'technician',
          serviceId: serviceType._id,
          city: normalizedCity,
        });
      }
    }

    return technicians;
  } catch (error) {
    console.error('Error finding technicians:', {
      message: error.message,
      stack: error.stack,
    });
    return [];
  }
}

module.exports = { findTechniciansForOrder };