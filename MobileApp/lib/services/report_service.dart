import 'package:soft/services/api_service.dart';

class ReportService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> createReport(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/reports', data);
  }

  Future<Map<String, dynamic>> updateReport(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put(
        '/reports/update/$id', data);
  }

  Future<Map<String, dynamic>> getByOrder(String id) async {
    return await _apiService.get('/reports/getByOrder/$id');
  }

  Future<Map<String, dynamic>> delete(String id) async {
    return await _apiService.delete('/reports/$id');
  }

  Future<Map<String, dynamic>> addTrip(String id) async {
    return await _apiService.put(
      '/reports/$id/add-trip-time',
      {},
    );
  }

  Future<Map<String, dynamic>> removeTrip(
    String id,
    int index,
  ) async {
    return await _apiService.put(
      '/reports/$id/remove-trip-time/$index',
      {},
    );
  }
}
