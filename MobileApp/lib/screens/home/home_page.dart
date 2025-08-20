// import 'dart:ui';

// import 'package:flutter/material.dart';
// import 'package:geocoding/geocoding.dart';
// import 'package:latlong2/latlong.dart' as latlng;
// import 'package:geolocator/geolocator.dart';
// import 'package:flutter_map/flutter_map.dart';
// import 'package:soft/models/device_model.dart';
// import 'package:soft/models/location_model.dart';
// import 'package:soft/providers/user_provider.dart';
// import 'package:soft/routes/app_routes.dart';
// import 'package:soft/routes/home__route.dart';
// import 'package:provider/provider.dart';
// import 'package:soft/services/device_service.dart';
// import 'package:soft/services/location_service.dart';

// class HomePage extends StatefulWidget {
//   const HomePage({super.key});

//   @override
//   State<HomePage> createState() => _HomePageState();
// }

// class _HomePageState extends State<HomePage> {
//   // Biến lưu trữ điều khiển của bản đồ
//   MapController _mapController = MapController();
//   // Vị trí hiện tại của người dùng
//   latlng.LatLng? _currentPosition;
//   String? _currentAddress;

//   @override
//   void initState() {
//     super.initState();
//     _mapController = MapController();
//     _determinePosition();
//     getAllDevice();
//     getAllLocation();
//   }

//   // Phương thức lấy vị trí và quyền
//   Future<void> _determinePosition() async {
//     LocationPermission permission;

//     permission = await Geolocator.checkPermission();
//     if (permission == LocationPermission.denied) {
//       permission = await Geolocator.requestPermission();
//     }

//     if (permission == LocationPermission.deniedForever) {
//       return;
//     }

//     final Position position =
//         await Geolocator.getCurrentPosition();
//     final latlng.LatLng latLng = latlng.LatLng(
//       position.latitude,
//       position.longitude,
//     );
//     final String address = await _getAddressFromLatLng(
//       latLng,
//     );

//     if (!mounted) return;
//     setState(() {
//       _currentPosition = latlng.LatLng(
//         position.latitude,
//         position.longitude,
//       );
//       _currentAddress = address;
//     });
//   }

//   // Lấy địa chỉ
//   Future<String> _getAddressFromLatLng(
//     latlng.LatLng position,
//   ) async {
//     try {
//       List<Placemark> placemarks =
//           await placemarkFromCoordinates(
//             position.latitude,
//             position.longitude,
//           );

//       if (placemarks.isNotEmpty) {
//         final placemark = placemarks.first;
//         return '${placemark.name}, ${placemark.street}, ${placemark.locality}, ${placemark.country}';
//       }
//     } catch (e) {
//       return 'Lỗi lấy địa chỉ: $e';
//     }
//     return 'Không tìm thấy địa chỉ';
//   }

//   final List<DeviceModel> devices = [];
//   final List<LocationModel> locations = [];
//   List<Marker> _deviceMarkers = [];
//   List<Marker> _locationMarkers = [];
//   latlng.LatLng? _selectedPosition;
//   double _radius = 0; // đơn vị: mét
//   List<CircleMarker> _circles = [];

//   void _addCurrentLocation() {
//     if (_selectedPosition != null) {
//       setState(() {
//         _radius = 50;
//       });
//       _updateCircle();
//       _showAddLocationModal(context);
//     }
//   }

//   void _updateCircle() {
//     if (_selectedPosition != null) {
//       setState(() {
//         _circles = [
//           CircleMarker(
//             point: _selectedPosition!,
//             color: Colors.blueAccent.withOpacity(0.2),
//             borderStrokeWidth: 2,
//             borderColor: Colors.blueAccent,
//             radius: _radius, // mét
//           ),
//         ];
//       });
//     }
//   }

//   final DeviceService _deviceService = DeviceService();
//   final LocationService _locationService =
//       LocationService();

//   void getAllDevice() async {
//     // ... logic lấy dữ liệu thiết bị
//     var result = await _deviceService.getAlldevice();
//     if (!mounted) return;
//     if (result['status'] == 'error') {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(
//           content: Text(result['message']),
//           backgroundColor: Colors.red,
//         ),
//       );
//     } else {
//       var data = result['data'];
//       List<DeviceModel> fetchedDevices =
//           (data as List)
//               .map((e) => DeviceModel.fromJson(e))
//               .toList();
//       List<Marker> markers =
//           fetchedDevices.map((device) {
//             // Cần đảm bảo tọa độ được chuyển đổi đúng
//             return Marker(
//               point: latlng.LatLng(
//                 device.coordinates!.coordinates[1],
//                 device.coordinates!.coordinates[0],
//               ),
//               width:
//                   100, // Kích thước đủ lớn để chứa Icon và Text
//               height: 100,
//               child: Column(
//                 mainAxisSize:
//                     MainAxisSize
//                         .min, // Đặt kích thước nhỏ nhất
//                 children: [
//                   // Icon
//                   Icon(
//                     Icons.navigation,
//                     color: Colors.blue,
//                   ),
//                   // Text hiển thị tên
//                   Text(
//                     device
//                         .code, // Sử dụng thuộc tính 'code' của device để lấy tên
//                     style: TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 12,
//                       color: Colors.black,
//                     ),
//                   ),
//                 ],
//               ),
//             );
//           }).toList();

//       setState(() {
//         devices.clear();
//         devices.addAll(fetchedDevices);
//         _deviceMarkers = markers;
//       });
//     }
//   }

//   void getAllLocation() async {
//     // ... logic lấy dữ liệu vị trí
//     var result = await _locationService.getAllLocation();
//     if (!mounted) return;
//     if (result['status'] == 'error') {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(
//           content: Text(result['message']),
//           backgroundColor: Colors.red,
//         ),
//       );
//     } else {
//       var data = result['data'];
//       List<LocationModel> fetchedLocations =
//           (data as List)
//               .map((e) => LocationModel.fromJson(e))
//               .toList();

//       List<Marker> locationMarkers =
//           fetchedLocations.map((location) {
//             return Marker(
//               point: latlng.LatLng(
//                 location.coordinates!.coordinates[1],
//                 location.coordinates!.coordinates[0],
//               ),
//               width:
//                   100, // Kích thước đủ lớn để chứa Icon và Text
//               height: 100,
//               child: Column(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   Icon(
//                     Icons.location_on,
//                     color: Colors.red,
//                   ),
//                   Text(
//                     location
//                         .name, // Sử dụng thuộc tính 'code' của device để lấy tên
//                     style: TextStyle(
//                       fontWeight: FontWeight.bold,
//                       fontSize: 12,
//                       color: Colors.black,
//                     ),
//                   ),
//                 ],
//               ),
//             );
//           }).toList();

//       setState(() {
//         locations.clear();
//         locations.addAll(fetchedLocations);
//         _locationMarkers = locationMarkers;
//       });
//     }
//   }

//   // create location
//   final TextEditingController _nameLocationController =
//       TextEditingController();
//   void createLocation() async {
//     final nameLocation = _nameLocationController.text;
//     var result = await _locationService.createLocation({
//       "name": nameLocation,
//       "distance": _radius,
//       "coordinates": {
//         "lat": _selectedPosition?.latitude,
//         "lng": _selectedPosition?.longitude,
//       },
//     });
//     if (!mounted) return;
//     if (result['status'] == 'error') {
//       ScaffoldMessenger.of(context).showSnackBar(
//         SnackBar(
//           content: Text(result['message']),
//           backgroundColor: Colors.red,
//         ),
//       );
//     } else {
//       Navigator.of(
//         context,
//         rootNavigator: true,
//       ).popUntil((route) => route.isFirst);
//       getAllLocation();
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     final user =
//         Provider.of<UserProvider>(
//           context,
//           listen: false,
//         ).user;
//     return Scaffold(
//       appBar: AppBar(
//         backgroundColor: Colors.blue,
//         automaticallyImplyLeading: false,
//         title: Image.asset('assets/logo.png', height: 40),
//         actions: [
//           IconButton(
//             onPressed: () async {
//               final selectedVehicle = await Navigator.of(
//                 context,
//                 rootNavigator: true,
//               ).pushNamed(AppRoute.homeVehicleSelect);
//               if (selectedVehicle != null &&
//                   selectedVehicle is DeviceModel) {
//                 final latLng = latlng.LatLng(
//                   selectedVehicle
//                       .coordinates!
//                       .coordinates[1],
//                   selectedVehicle
//                       .coordinates!
//                       .coordinates[0],
//                 );

//                 setState(() {
//                   _currentPosition = latLng;
//                 });

//                 _mapController.move(latLng, 17.0);

//                 // Optional: cập nhật địa chỉ hiển thị
//                 final address = await _getAddressFromLatLng(
//                   latLng,
//                 );
//                 setState(() {
//                   _currentAddress = address;
//                 });
//               }
//             },
//             style: IconButton.styleFrom(
//               foregroundColor: Colors.white,
//             ),
//             icon: Icon(
//               Icons.manage_search_outlined,
//               size: 30,
//             ),
//           ),
//           IconButton(
//             onPressed: () async {
//               final selectedLocation = await Navigator.of(
//                 context,
//                 rootNavigator: true,
//               ).pushNamed(AppRoute.locationSelect);
//               if (selectedLocation != null &&
//                   selectedLocation is LocationModel) {
//                 final latLng = latlng.LatLng(
//                   selectedLocation
//                       .coordinates!
//                       .coordinates[1],
//                   selectedLocation
//                       .coordinates!
//                       .coordinates[0],
//                 );

//                 setState(() {
//                   _currentPosition = latLng;
//                 });

//                 _mapController.move(latLng, 17.0);

//                 // Optional: cập nhật địa chỉ hiển thị
//                 final address = await _getAddressFromLatLng(
//                   latLng,
//                 );
//                 setState(() {
//                   _currentAddress = address;
//                 });
//               }
//             },
//             style: IconButton.styleFrom(
//               foregroundColor: Colors.white,
//             ),
//             icon: Icon(Icons.location_on_sharp, size: 30),
//           ),
//           PopupMenuButton<String>(
//             color: Colors.white,
//             onSelected: (value) async {
//               if (value == "Đăng xuất") {
//                 await Provider.of<UserProvider>(
//                   context,
//                   listen: false,
//                 ).clearUser();
//                 Navigator.of(
//                   context,
//                   rootNavigator: true,
//                 ).pushNamedAndRemoveUntil(
//                   AppRoute.signin,
//                   (route) => false,
//                 );
//               } else if (value == "Liên hệ") {
//                 Navigator.of(
//                   context,
//                   rootNavigator: true,
//                 ).pushNamed(AppRoute.contact);
//               } else if (value == "Thông báo") {
//                 Navigator.pushNamed(
//                   context,
//                   HomeRoutes.notification,
//                 );
//               }
//             },
//             itemBuilder:
//                 (BuildContext context) => [
//                   PopupMenuItem(
//                     value: 'Cài đặt',
//                     child: Row(
//                       children: [
//                         Icon(
//                           Icons.settings,
//                           color: Colors.blue,
//                         ),
//                         SizedBox(width: 10),
//                         Text('Cài đặt'),
//                       ],
//                     ),
//                   ),
//                   PopupMenuItem(
//                     value: "Thông báo",
//                     child: Row(
//                       children: [
//                         Icon(
//                           Icons.notifications_none,
//                           color: Colors.blue,
//                         ),
//                         SizedBox(width: 10),
//                         Text('Thông báo'),
//                       ],
//                     ),
//                   ),
//                   PopupMenuItem(
//                     value: "Liên hệ",
//                     child: Row(
//                       children: [
//                         Icon(
//                           Icons.contact_support_outlined,
//                           color: Colors.blue,
//                         ),
//                         SizedBox(width: 10),
//                         Text('Liên hệ'),
//                       ],
//                     ),
//                   ),
//                   const PopupMenuDivider(),
//                   PopupMenuItem(
//                     value: "Đăng xuất",
//                     child: Row(
//                       children: [
//                         Icon(
//                           Icons.logout,
//                           color: Colors.blue,
//                         ),
//                         SizedBox(width: 10),
//                         Text('Đăng xuất'),
//                       ],
//                     ),
//                   ),
//                 ],
//             icon: Icon(
//               Icons.more_vert,
//               size: 30,
//               color: Colors.white,
//             ),
//           ),
//         ],
//       ),
//       body:
//           _currentPosition == null
//               ? Center(child: CircularProgressIndicator())
//               : Stack(
//                 children: [
//                   FlutterMap(
//                     mapController: _mapController,
//                     options: MapOptions(
//                       initialCenter: _currentPosition!,
//                       initialZoom: 16.0,
//                       onMapReady: () async {
//                         if (_currentPosition != null) {
//                           _mapController.move(
//                             _currentPosition!,
//                             16,
//                           );
//                         } else {
//                           await _determinePosition(); // lấy vị trí rồi mới move
//                         }
//                       },
//                       onPositionChanged: (
//                         position,
//                         hasGesture,
//                       ) {
//                         _selectedPosition = position.center;
//                         _updateCircle();
//                       },
//                     ),
//                     children: [
//                       TileLayer(
//                         urlTemplate:
//                             "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
//                         userAgentPackageName:
//                             'com.ecotel.ktv',
//                         tileProvider: NetworkTileProvider(
//                           headers: {
//                             'Cache-Control':
//                                 'max-age=3600', // Cache trong 1 giờ
//                           },
//                         ),
//                       ),
//                       CircleLayer(circles: _circles),
//                       MarkerLayer(
//                         markers: [
//                           ..._deviceMarkers,
//                           ..._locationMarkers,
//                         ],
//                       ),
//                     ],
//                   ),
//                   Positioned(
//                     top: 10,
//                     left: 10,
//                     right: 10,
//                     child: Container(
//                       padding: const EdgeInsets.all(12),
//                       decoration: BoxDecoration(
//                         color: Colors.white,
//                         borderRadius: BorderRadius.circular(
//                           12,
//                         ),
//                         boxShadow: const [
//                           BoxShadow(
//                             color: Colors.black12,
//                             blurRadius: 6,
//                             offset: Offset(0, 2),
//                           ),
//                         ],
//                       ),
//                       child: Text(
//                         _currentAddress ??
//                             'Đang lấy địa chỉ...',
//                         style: const TextStyle(
//                           fontSize: 14,
//                         ),
//                         maxLines: 2,
//                         overflow: TextOverflow.ellipsis,
//                       ),
//                     ),
//                   ),
//                   const Align(
//                     alignment: Alignment.center,
//                     child: IgnorePointer(
//                       child: Icon(
//                         Icons.add_location_alt,
//                         color: Colors.blue,
//                         size: 40,
//                       ),
//                     ),
//                   ),
//                   Positioned(
//                     top: 100,
//                     right: 20,
//                     child: FloatingActionButton(
//                       onPressed: _addCurrentLocation,
//                       backgroundColor: Colors.white,
//                       child: const Icon(
//                         Icons.add_location_alt,
//                       ),
//                     ),
//                   ),
//                 ],
//               ),
//     );
//   }

//   void _showAddLocationModal(BuildContext context) {
//     showModalBottomSheet(
//       context: context,
//       isScrollControlled: true,
//       shape: RoundedRectangleBorder(
//         borderRadius: BorderRadius.vertical(
//           top: Radius.circular(16),
//         ),
//       ),
//       builder: (BuildContext context) {
//         return StatefulBuilder(
//           builder: (
//             BuildContext context,
//             void Function(void Function()) setModalState,
//           ) {
//             return Padding(
//               padding: EdgeInsets.only(
//                 bottom:
//                     MediaQuery.of(
//                       context,
//                     ).viewInsets.bottom,
//                 left: 16,
//                 right: 16,
//                 top: 24,
//               ),
//               child: Column(
//                 mainAxisSize: MainAxisSize.min,
//                 children: [
//                   Text(
//                     'Di chuyển bản đồ đến điểm cần tạo\n Bán kính nhận diện: ${_radius.toInt()} m',
//                     style: TextStyle(
//                       fontSize: 18,
//                       fontWeight: FontWeight.bold,
//                     ),
//                     textAlign: TextAlign.center,
//                   ),
//                   SizedBox(height: 12),
//                   Row(
//                     mainAxisAlignment:
//                         MainAxisAlignment.spaceBetween,
//                     children: [
//                       IconButton(
//                         onPressed: () {
//                           setState(() {
//                             _radius = 0;
//                             _circles.clear();
//                           });
//                           Navigator.pop(context);
//                         },
//                         icon: Icon(Icons.close),
//                       ),
//                       Expanded(
//                         child: Slider(
//                           min: 10,
//                           max: 500,
//                           divisions: 19,
//                           value: _radius,
//                           label: "${_radius.toInt()} m",
//                           onChanged: (value) {
//                             setModalState(
//                               () => _radius = value,
//                             );
//                             setState(
//                               () => _radius = value,
//                             ); // Cập nhật cả parent state
//                             _updateCircle();
//                           },
//                         ),
//                       ),
//                       IconButton(
//                         onPressed: () {
//                           _showCreateLocationDialog(
//                             context,
//                           );
//                         },
//                         icon: Icon(
//                           Icons.arrow_forward_ios_outlined,
//                         ),
//                       ),
//                     ],
//                   ),
//                 ],
//               ),
//             );
//           },
//         );
//       },
//     ).whenComplete(() {
//       setState(() {
//         _radius = 0;
//         _circles.clear();
//       });
//     });
//   }

//   void _showCreateLocationDialog(BuildContext context) {
//     showDialog(
//       context: context,
//       builder:
//           (BuildContext dialogContext) => StatefulBuilder(
//             builder: (
//               BuildContext context,
//               StateSetter setDialogState,
//             ) {
//               return AlertDialog(
//                 title: Text('Tạo vị trí mới'),
//                 content: TextField(
//                   controller: _nameLocationController,
//                   decoration: InputDecoration(
//                     labelText: "Tên điểm",
//                     border: OutlineInputBorder(),
//                   ),
//                 ),
//                 actions: [
//                   TextButton(
//                     onPressed: () {
//                       Navigator.pop(dialogContext);
//                     },
//                     child: Text(
//                       "Hủy",
//                       style: TextStyle(color: Colors.grey),
//                     ),
//                   ),
//                   TextButton(
//                     onPressed: () {
//                       // Kiểm tra dữ liệu trước khi tạo
//                       if (_nameLocationController.text
//                           .trim()
//                           .isEmpty) {
//                         ScaffoldMessenger.of(
//                           context,
//                         ).showSnackBar(
//                           SnackBar(
//                             content: Text(
//                               'Vui lòng nhập tên điểm',
//                             ),
//                             backgroundColor: Colors.red,
//                           ),
//                         );
//                         return;
//                       }
//                       createLocation();
//                     },
//                     child: Text(
//                       "Lưu lại",
//                       style: TextStyle(color: Colors.blue),
//                     ),
//                   ),
//                 ],
//               );
//             },
//           ),
//     );
//   }
// }
