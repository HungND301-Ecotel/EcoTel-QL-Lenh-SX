import 'package:soft/services/api_service.dart';

class OrderService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> createOrder(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/order/create', data);
  }

  Future<Map<String, dynamic>> getAllOrder() async {
    return await _apiService.get('/order/getAll');
  }

  Future<Map<String, dynamic>> delete(String id) async {
    return await _apiService.delete('/order/delete/$id');
  }

  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/order/update/$id', data);
  }

  Future<Map<String, dynamic>> getByUser() async {
    return await _apiService.get('/order/getByUser');
  }

  Future<Map<String, dynamic>> getbyId(String id) async {
    return await _apiService.get('/order/getById/$id');
  }

  Future<Map<String, dynamic>> scanWork(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.post('/order/scanWork', data);
  }
}
