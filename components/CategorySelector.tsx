import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  category: string;
  setCategory: (cat: string) => void;
}

const CategorySelector: React.FC<Props> = ({ categories, category, setCategory }) => {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          onPress={() => setCategory(cat.name)}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            marginRight: 8,
            marginBottom: 8,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#D1D5DB",
            backgroundColor: category === cat.name ? "#3B82F6" : "#fff",
          }}
        >
          <Text style={{ fontWeight: "600", color: category === cat.name ? "#fff" : "#374151" }}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CategorySelector;
