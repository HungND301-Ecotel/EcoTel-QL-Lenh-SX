import 'package:soft/services/api_service.dart';

class TaskService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllTask() async {
    return await _apiService.get('/jobs');
  }
}
