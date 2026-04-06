import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const CustomLineChart = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <h2 className="text-lg font-semibold mb-2">Balance Trend</h2>
      <div className="flex justify-center">
      <LineChart width={800} height={300} data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="balance" stroke="#8884d8" />
      </LineChart>
      </div>
    </div>
  );
};

export default CustomLineChart;