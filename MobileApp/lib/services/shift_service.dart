import 'package:soft/services/api_service.dart';

class ShiftService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllShift() async {
    return await _apiService.get('/shifts');
  }
}
