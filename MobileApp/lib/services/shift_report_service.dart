import 'package:soft/services/api_service.dart';

class ShiftReportService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> create(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/shiftReports', data);
  }

  Future<Map<String, dynamic>> getOne(String id) async {
    return await _apiService.get('/shiftReports/$id');
  }
}
