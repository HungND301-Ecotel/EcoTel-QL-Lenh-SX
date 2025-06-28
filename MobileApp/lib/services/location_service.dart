import 'package:soft/services/api_service.dart';

class LocationService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllLocation() async {
    return await _apiService.get('/locations');
  }

  Future<Map<String, dynamic>> createLocation(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/locations', data);
  }
}
