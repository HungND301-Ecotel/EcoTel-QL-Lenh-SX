import 'package:soft/services/api_service.dart';

class DeviceService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

// loc theo don vi
  Future<Map<String, dynamic>> getAlldevice() async {
    return await _apiService.get('/devices');
  }
// loc may xuc
  Future<Map<String, dynamic>> getAllExcavator() async {
    return await _apiService.get('/devices/excavators/all');
  }

// loc van tai
  Future<Map<String, dynamic>> getAllCar() async {
    return await _apiService.get('/devices/car/all');
  }
// loc loai xe
  Future<Map<String, dynamic>> getAllVehicle() async {
    return await _apiService.get('/devices/vehicle/all');
  }
// tat ca
  Future<Map<String, dynamic>> getDevicesAll() async {
    return await _apiService.get('/devices/all');
  }
// theo id
  Future<Map<String, dynamic>> getById(String id) async {
    return await _apiService.get('/devices/$id');
  }

  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/devices/$id', data);
  }
}
