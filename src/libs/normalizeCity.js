const normalizeCity = (city) => {
    if (!city) return city; // Trả về nguyên giá trị nếu city là null hoặc undefined
  
    const cityMap = {
     // Hà Nội
  'ha noi': 'Hà Nội',
  'hanoi': 'Hà Nội',
  'hà nội': 'Hà Nội',
  'ha nôi': 'Hà Nội',
  'hanoï': 'Hà Nội',

  // TP. Hồ Chí Minh
  'ho chi minh': 'TP. Hồ Chí Minh',
  'tphcm': 'TP. Hồ Chí Minh',
  'tp hcm': 'TP. Hồ Chí Minh',
  'tp. hcm': 'TP. Hồ Chí Minh',
  'tp ho chi minh': 'TP. Hồ Chí Minh',
  'tp. ho chi minh': 'TP. Hồ Chí Minh',
  'hồ chí minh': 'TP. Hồ Chí Minh',
  'hcm': 'TP. Hồ Chí Minh',
  'sai gon': 'TP. Hồ Chí Minh',
  'saigon': 'TP. Hồ Chí Minh',
  'sài gòn': 'TP. Hồ Chí Minh',

  // Đà Nẵng
  'da nang': 'Đà Nẵng',
  'danang': 'Đà Nẵng',
  'đà nẵng': 'Đà Nẵng',
  'da năng': 'Đà Nẵng',
  'đà năng': 'Đà Nẵng',

  // Cần Thơ
  'can tho': 'Cần Thơ',
  'cantho': 'Cần Thơ',
  'cần thơ': 'Cần Thơ',
  'cân thơ': 'Cần Thơ',

  // Hải Phòng
  'hai phong': 'Hải Phòng',
  'haiphong': 'Hải Phòng',
  'hải phòng': 'Hải Phòng',
  'hai phòng': 'Hải Phòng',

  // An Giang
  'an giang': 'An Giang',
  'angiang': 'An Giang',
  'an giàng': 'An Giang',

  // Bà Rịa - Vũng Tàu
  'ba ria vung tau': 'Bà Rịa - Vũng Tàu',
  'ba ria - vung tau': 'Bà Rịa - Vũng Tàu',
  'bariavungtau': 'Bà Rịa - Vũng Tàu',
  'bà rịa vũng tàu': 'Bà Rịa - Vũng Tàu',
  'bà rịa - vũng tàu': 'Bà Rịa - Vũng Tàu',
  'vung tau': 'Bà Rịa - Vũng Tàu',
  'vũng tàu': 'Bà Rịa - Vũng Tàu',

  // Bắc Giang
  'bac giang': 'Bắc Giang',
  'bacgiang': 'Bắc Giang',
  'bắc giang': 'Bắc Giang',
  'băc giang': 'Bắc Giang',

  // Bắc Kạn
  'bac kan': 'Bắc Kạn',
  'backan': 'Bắc Kạn',
  'bắc kạn': 'Bắc Kạn',
  'băc kạn': 'Bắc Kạn',

  // Bạc Liêu
  'bac lieu': 'Bạc Liêu',
  'baclieu': 'Bạc Liêu',
  'bạc liêu': 'Bạc Liêu',
  'bạc lieu': 'Bạc Liêu',

  // Bắc Ninh
  'bac ninh': 'Bắc Ninh',
  'bacninh': 'Bắc Ninh',
  'bắc ninh': 'Bắc Ninh',
  'băc ninh': 'Bắc Ninh',

  // Bến Tre
  'ben tre': 'Bến Tre',
  'bentre': 'Bến Tre',
  'bến tre': 'Bến Tre',
  'bên tre': 'Bến Tre',

  // Bình Định
  'binh dinh': 'Bình Định',
  'binhdinh': 'Bình Định',
  'bình định': 'Bình Định',
  'binh đinh': 'Bình Định',

  // Bình Dương
  'binh duong': 'Bình Dương',
  'binhduong': 'Bình Dương',
  'bình dương': 'Bình Dương',
  'binh dương': 'Bình Dương',

  // Bình Phước
  'binh phuoc': 'Bình Phước',
  'binhphuoc': 'Bình Phước',
  'bình phước': 'Bình Phước',
  'binh phươc': 'Bình Phước',

  // Bình Thuận
  'binh thuan': 'Bình Thuận',
  'binhthuan': 'Bình Thuận',
  'bình thuận': 'Bình Thuận',
  'binh thuân': 'Bình Thuận',

  // Cà Mau
  'ca mau': 'Cà Mau',
  'camau': 'Cà Mau',
  'cà mau': 'Cà Mau',
  'cà màu': 'Cà Mau',

  // Cao Bằng
  'cao bang': 'Cao Bằng',
  'caobang': 'Cao Bằng',
  'cao bằng': 'Cao Bằng',
  'cao bàng': 'Cao Bằng',

  // Đắk Lắk
  'dak lak': 'Đắk Lắk',
  'daklak': 'Đắk Lắk',
  'đắk lắk': 'Đắk Lắk',
  'đăk lăk': 'Đắk Lắk',

  // Đắk Nông
  'dak nong': 'Đắk Nông',
  'daknong': 'Đắk Nông',
  'đắk nông': 'Đắk Nông',
  'đăk nông': 'Đắk Nông',

  // Điện Biên
  'dien bien': 'Điện Biên',
  'dienbien': 'Điện Biên',
  'điện biên': 'Điện Biên',
  'điên biên': 'Điện Biên',

  // Đồng Nai
  'dong nai': 'Đồng Nai',
  'dongnai': 'Đồng Nai',
  'đồng nai': 'Đồng Nai',
  'đông nai': 'Đồng Nai',

  // Đồng Tháp
  'dong thap': 'Đồng Tháp',
  'dongthap': 'Đồng Tháp',
  'đồng tháp': 'Đồng Tháp',
  'đông tháp': 'Đồng Tháp',

  // Gia Lai
  'gia lai': 'Gia Lai',
  'gialai': 'Gia Lai',
  'gia lai': 'Gia Lai',

  // Hà Giang
  'ha giang': 'Hà Giang',
  'hagiang': 'Hà Giang',
  'hà giang': 'Hà Giang',
  'hà giàng': 'Hà Giang',

  // Hà Nam
  'ha nam': 'Hà Nam',
  'hanam': 'Hà Nam',
  'hà nam': 'Hà Nam',
  'hà nàm': 'Hà Nam',

  // Hà Tĩnh
  'ha tinh': 'Hà Tĩnh',
  'hatinh': 'Hà Tĩnh',
  'hà tĩnh': 'Hà Tĩnh',
  'hà tinh': 'Hà Tĩnh',

  // Hải Dương
  'hai duong': 'Hải Dương',
  'haiduong': 'Hải Dương',
  'hải dương': 'Hải Dương',
  'hai dương': 'Hải Dương',

  // Hậu Giang
  'hau giang': 'Hậu Giang',
  'haugiang': 'Hậu Giang',
  'hậu giang': 'Hậu Giang',
  'hâu giang': 'Hậu Giang',

  // Hòa Bình
  'hoa binh': 'Hòa Bình',
  'hoabinh': 'Hòa Bình',
  'hòa bình': 'Hòa Bình',
  'hòa binh': 'Hòa Bình',

  // Hưng Yên
  'hung yen': 'Hưng Yên',
  'hungyen': 'Hưng Yên',
  'hưng yên': 'Hưng Yên',
  'hưng yen': 'Hưng Yên',

  // Khánh Hòa
  'khanh hoa': 'Khánh Hòa',
  'khanhhoa': 'Khánh Hòa',
  'khánh hòa': 'Khánh Hòa',
  'khánh hoà': 'Khánh Hòa',

  // Kiên Giang
  'kien giang': 'Kiên Giang',
  'kiengiang': 'Kiên Giang',
  'kiên giang': 'Kiên Giang',
  'kiên giàng': 'Kiên Giang',

  // Kon Tum
  'kon tum': 'Kon Tum',
  'kontum': 'Kon Tum',
  'kon tum': 'Kon Tum',
  'kon tũm': 'Kon Tum',

  // Lai Châu
  'lai chau': 'Lai Châu',
  'laichau': 'Lai Châu',
  'lai châu': 'Lai Châu',
  'lai châu': 'Lai Châu',

  // Lâm Đồng
  'lam dong': 'Lâm Đồng',
  'lamdong': 'Lâm Đồng',
  'lâm đồng': 'Lâm Đồng',
  'lâm đông': 'Lâm Đồng',

  // Lạng Sơn
  'lang son': 'Lạng Sơn',
  'langson': 'Lạng Sơn',
  'lạng sơn': 'Lạng Sơn',
  'lạng son': 'Lạng Sơn',

  // Lào Cai
  'lao cai': 'Lào Cai',
  'laocai': 'Lào Cai',
  'lào cai': 'Lào Cai',
  'lào càì': 'Lào Cai',

  // Long An
  'long an': 'Long An',
  'longan': 'Long An',
  'long an': 'Long An',

  // Nam Định
  'nam dinh': 'Nam Định',
  'namdinh': 'Nam Định',
  'nam định': 'Nam Định',
  'nam đinh': 'Nam Định',

  // Nghệ An
  'nghe an': 'Nghệ An',
  'nghean': 'Nghệ An',
  'nghệ an': 'Nghệ An',
  'nghê an': 'Nghệ An',

  // Ninh Bình
  'ninh binh': 'Ninh Bình',
  'ninhbinh': 'Ninh Bình',
  'ninh bình': 'Ninh Bình',
  'ninh binh': 'Ninh Bình',

  // Ninh Thuận
  'ninh thuan': 'Ninh Thuận',
  'ninhthuan': 'Ninh Thuận',
  'ninh thuận': 'Ninh Thuận',
  'ninh thuân': 'Ninh Thuận',

  // Phú Thọ
  'phu tho': 'Phú Thọ',
  'phutho': 'Phú Thọ',
  'phú thọ': 'Phú Thọ',
  'phú thố': 'Phú Thọ',

  // Phú Yên
  'phu yen': 'Phú Yên',
  'phuyen': 'Phú Yên',
  'phú yên': 'Phú Yên',
  'phú yen': 'Phú Yên',

  // Quảng Bình
  'quang binh': 'Quảng Bình',
  'quangbinh': 'Quảng Bình',
  'quảng bình': 'Quảng Bình',
  'quang binh': 'Quảng Bình',

  // Quảng Nam
  'quang nam': 'Quảng Nam',
  'quangnam': 'Quảng Nam',
  'quảng nam': 'Quảng Nam',
  'quang nàm': 'Quảng Nam',

  // Quảng Ngãi
  'quang ngai': 'Quảng Ngãi',
  'quangngai': 'Quảng Ngãi',
  'quảng ngãi': 'Quảng Ngãi',
  'quang ngai': 'Quảng Ngãi',

  // Quảng Ninh
  'quang ninh': 'Quảng Ninh',
  'quangninh': 'Quảng Ninh',
  'quảng ninh': 'Quảng Ninh',
  'quang nình': 'Quảng Ninh',

  // Quảng Trị
  'quang tri': 'Quảng Trị',
  'quangtri': 'Quảng Trị',
  'quảng trị': 'Quảng Trị',
  'quang trị': 'Quảng Trị',

  // Sóc Trăng
  'soc trang': 'Sóc Trăng',
  'soctrang': 'Sóc Trăng',
  'sóc trăng': 'Sóc Trăng',
  'sóc trang': 'Sóc Trăng',

  // Sơn La
  'son la': 'Sơn La',
  'sonla': 'Sơn La',
  'sơn la': 'Sơn La',
  'sôn la': 'Sơn La',

  // Tây Ninh
  'tay ninh': 'Tây Ninh',
  'tayninh': 'Tây Ninh',
  'tây ninh': 'Tây Ninh',
  'tây nình': 'Tây Ninh',

  // Thái Bình
  'thai binh': 'Thái Bình',
  'thaibinh': 'Thái Bình',
  'thái bình': 'Thái Bình',
  'thai binh': 'Thái Bình',

  // Thái Nguyên
  'thai nguyen': 'Thái Nguyên',
  'thainguyen': 'Thái Nguyên',
  'thái nguyên': 'Thái Nguyên',
  'thai nguyên': 'Thái Nguyên',

  // Thanh Hóa
  'thanh hoa': 'Thanh Hóa',
  'thanhhoa': 'Thanh Hóa',
  'thanh hóa': 'Thanh Hóa',
  'thanh hoá': 'Thanh Hóa',

  // Thừa Thiên Huế
  'thua thien hue': 'Thừa Thiên Huế',
  'thuathienhue': 'Thừa Thiên Huế',
  'thừa thiên huế': 'Thừa Thiên Huế',
  'thua thiên huế': 'Thừa Thiên Huế',
  'hue': 'Thừa Thiên Huế',
  'huế': 'Thừa Thiên Huế',

  // Tiền Giang
  'tien giang': 'Tiền Giang',
  'tiengiang': 'Tiền Giang',
  'tiền giang': 'Tiền Giang',
  'tiên giang': 'Tiền Giang',

  // Trà Vinh
  'tra vinh': 'Trà Vinh',
  'travinh': 'Trà Vinh',
  'trà vinh': 'Trà Vinh',
  'trà vình': 'Trà Vinh',

  // Tuyên Quang
  'tuyen quang': 'Tuyên Quang',
  'tuyenquang': 'Tuyên Quang',
  'tuyên quang': 'Tuyên Quang',
  'tuyên quang': 'Tuyên Quang',

  // Vĩnh Long
  'vinh long': 'Vĩnh Long',
  'vinhlong': 'Vĩnh Long',
  'vĩnh long': 'Vĩnh Long',
  'vình long': 'Vĩnh Long',

  // Vĩnh Phúc
  'vinh phuc': 'Vĩnh Phúc',
  'vinhphuc': 'Vĩnh Phúc',
  'vĩnh phúc': 'Vĩnh Phúc',
  'vình phúc': 'Vĩnh Phúc',

  // Yên Bái
  'yen bai': 'Yên Bái',
  'yenbai': 'Yên Bái',
  'yên bái': 'Yên Bái',
  'yên bai': 'Yên Bái',
      // Thêm các ánh xạ khác nếu cần
    };
  
    return cityMap[city.toLowerCase()] || city; // Trả về city nguyên bản nếu không có trong cityMap
  };
  
  module.exports = { normalizeCity }; // Export cho BE
  