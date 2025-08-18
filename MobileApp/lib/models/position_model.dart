class PositionModel {
  final String id;
  final String name;
  final String? note;

  PositionModel({
    required this.id,
    required this.name,
    this.note,
  });

  factory PositionModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return PositionModel(
      id: json?['_id']??'',
      name: json?['name']??'',
      note: json?['note']??'',
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'name': name,
    'note': note,
  };
}
