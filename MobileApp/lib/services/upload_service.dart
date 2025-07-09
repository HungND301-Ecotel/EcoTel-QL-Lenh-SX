import 'dart:io';

import 'package:path/path.dart' as path;
import 'package:soft/services/api_service.dart';

class UploadService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> upload(
    File filename,
    String type,
  ) async {
    final file = path.basename(filename.path);
    return await _apiService.get(
      '/uploads?fileName=$file&type=$type',
    );
  }
}
