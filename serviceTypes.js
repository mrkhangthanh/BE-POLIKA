
const ServiceType = require('./src/apps/order/models/serviceType');
const mongoose = require('./src/common/init.myDB')();

const serviceTypes = [
  { value: 'DienNuoc', label: 'Điện nước' },
  { value: 'ChongTham', label: 'Chống thấm' },
  { value: 'DonVeSinh', label: 'Dọn vệ sinh' },
  { value: 'SuaMayGiat', label: 'Sửa máy giặt' },
  { value: 'DieuHoa', label: 'Điều hòa' },
  { value: 'other', label: 'Khác' },
];

mongoose.connect('mongodb://127.0.0.1:27017/polikaDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

const seedServiceTypes = async () => {
  await ServiceType.deleteMany({});
  await ServiceType.insertMany(serviceTypes);
  console.log('Service types seeded successfully');
  mongoose.connection.close();
};

seedServiceTypes();