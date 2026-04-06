import { PieChart, Pie, Cell } from "recharts";

const COLORS = ["#00C49F", "#FF8042", "#0088FE", "#FFBB28"];

const CustomPieChart = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <h2 className="text-lg font-semibold mb-2">Spending Breakdown</h2>

        <div className="flex justify-center">
        <PieChart width={350} height={300}>
        <Pie data={data} dataKey="value" outerRadius={100}>
          {data.map((entry, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        </PieChart>
        </div>
    </div>
  );
};

export default CustomPieChart;