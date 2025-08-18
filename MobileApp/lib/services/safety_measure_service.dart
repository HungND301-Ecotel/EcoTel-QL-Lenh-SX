import 'package:soft/services/api_service.dart';

class SafetyMeasureService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllSafetyMeasure() async {
    return await _apiService.get('/safetyMeasures');
  }
}
