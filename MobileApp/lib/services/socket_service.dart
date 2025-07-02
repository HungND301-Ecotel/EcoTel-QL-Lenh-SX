import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart'
    as IO;

class SocketService {
  static final SocketService _instance =
      SocketService._internal();

  factory SocketService() {
    return _instance;
  }

  late IO.Socket _socket;

  bool get isConnectted => _socket.connected;

  SocketService._internal() {
    _socket = IO.io(
      dotenv.env['SOCKET_API'] ?? 'ws://192.168.2.10:8080',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );
  }

  void connect(String userId) {
    if (!_socket.connected) {
      _socket.connect();
    }

    _socket.onConnect((_) {
      print('✅ Connected to server');
      _socket.emit('notification', userId);
    });

    _socket.onDisconnect(
      (_) => print('🔴 Disconnected from server'),
    );
  }

  void disconnect() {
    _socket.disconnect();
  }

  void on(String event, Function(dynamic) callback) {
    _socket.on(event, callback);
  }

  void emit(String event, dynamic data) {
    _socket.emit(event, data);
  }

  void off(String event) {
    _socket.off(event);
  }
}
