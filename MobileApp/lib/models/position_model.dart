class PositionModel {
  final String id;
  final String name;

  PositionModel({
    required this.id,
    required this.name,
  });

  factory PositionModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return PositionModel(
      id: json?['_id']??'',
      name: json?['name']??'',
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'name': name,
  };
}
