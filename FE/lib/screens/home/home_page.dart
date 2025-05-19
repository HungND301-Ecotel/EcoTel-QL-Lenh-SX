import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:job_manager/providers/user_provider.dart';
import 'package:job_manager/routes/app_routes.dart';
import 'package:job_manager/routes/home__route.dart';
import 'package:provider/provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  GoogleMapController?
  _mapController; //Biến lưu trữ điều khiển của bản đồ, dùng để thay đổi vị trí của camera khi di chuyển.
  LatLng?
  _currentPosition; //Biến lưu trữ vị trí hiện tại của người dùng (tọa độ latitude, longitude).
  String? _currentAddress;

  @override
  void initState() {
    super.initState();
    _determinePosition();
  }

  Future<void> _determinePosition() async {
    LocationPermission permission;

    // Kiểm tra quyền
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      return; // Không có quyền
    }

    // Lấy vị trí hiện tại
    final Position position =
        await Geolocator.getCurrentPosition();
    final LatLng latLng = LatLng(
      position.latitude,
      position.longitude,
    );
    final String address = await _getAddressFromLatLng(
      latLng,
    );
    if (!mounted) return;
    setState(() {
      _currentPosition = LatLng(
        position.latitude,
        position.longitude,
      );
      _currentAddress = address;
    });

    // Di chuyển camera đến vị trí
    _mapController?.animateCamera(
      CameraUpdate.newLatLng(_currentPosition!),
    );
  }

  Future<String> _getAddressFromLatLng(
    LatLng position,
  ) async {
    try {
      List<Placemark> placemarks =
          await placemarkFromCoordinates(
            position.latitude,
            position.longitude,
          );

      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        return '${placemark.name}, ${placemark.street}, ${placemark.locality}, ${placemark.country}';
      }
    } catch (e) {
      return 'Lỗi lấy địa chỉ: $e';
    }
    return 'Không tìm thấy địa chỉ';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        title: Image.asset('assets/logo.png', height: 40),
        actions: [
          IconButton(
            onPressed: () {},
            style: IconButton.styleFrom(
              foregroundColor: Colors.white,
            ),
            icon: Icon(
              Icons.manage_search_outlined,
              size: 30,
            ),
          ),
          IconButton(
            onPressed: () {},
            style: IconButton.styleFrom(
              foregroundColor: Colors.white,
            ),
            icon: Icon(Icons.location_on_sharp, size: 30),
          ),
          PopupMenuButton<String>(
            color: Colors.white,
            onSelected: (value) async {
              if (value == "Đăng xuất") {
                await Provider.of<UserProvider>(
                  context,
                  listen: false,
                ).clearUser();
                Navigator.of(
                  context,
                  rootNavigator: true,
                ).pushNamed(AppRoute.signin);
              } else if (value == "Liên hệ") {
                Navigator.of(
                  context,
                  rootNavigator: true,
                ).pushNamed(AppRoute.contact);
              } else if (value == "Thông báo") {
                Navigator.pushNamed(
                  context,
                  HomeRoutes.notification,
                );
              }
            },
            itemBuilder:
                (BuildContext context) => [
                  PopupMenuItem(
                    value: 'Cài đặt',
                    child: Row(
                      children: [
                        Icon(
                          Icons.settings,
                          color: Colors.blue,
                        ),
                        SizedBox(width: 10),
                        Text('Cài đặt'),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: "Thông báo",
                    child: Row(
                      children: [
                        Icon(
                          Icons.notifications_none,
                          color: Colors.blue,
                        ),
                        SizedBox(width: 10),
                        Text('Thông báo'),
                      ],
                    ),
                  ),
                  PopupMenuItem(
                    value: "Liên hệ",
                    child: Row(
                      children: [
                        Icon(
                          Icons.contact_support_outlined,
                          color: Colors.blue,
                        ),
                        SizedBox(width: 10),
                        Text('Liên hệ'),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  PopupMenuItem(
                    value: "Đăng xuất",
                    child: Row(
                      children: [
                        Icon(
                          Icons.logout,
                          color: Colors.blue,
                        ),
                        SizedBox(width: 10),
                        Text('Đăng xuất'),
                      ],
                    ),
                  ),
                ],
            icon: Icon(
              Icons.more_vert,
              size: 30,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body:
          _currentPosition == null
              ? Center(child: CircularProgressIndicator())
              : Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: _currentPosition!,
                      zoom: 16,
                    ),
                    myLocationEnabled: true,
                    myLocationButtonEnabled: true,
                    onMapCreated:
                        (controller) =>
                            _mapController = controller,
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(
                          12,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black12,
                            blurRadius: 6,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Text(
                        _currentAddress ??
                            'Đang lấy địa chỉ...',
                        style: TextStyle(fontSize: 14),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
    );
  }
}
