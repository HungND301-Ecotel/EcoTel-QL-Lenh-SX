import 'package:job_manager/services/api_service.dart';

class LocationService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllLocation() async {
    return await _apiService.get(
      '/location/getAll',
    );
  }
}
