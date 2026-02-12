type Props = {
  status: string;
};

const MAP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  canceled: "bg-red-100 text-red-800",
};

export default function OrderStatusBadge({ status }: Props) {
  const style = MAP[status] ?? "bg-zinc-100 text-zinc-700";

  return (
    <span className={`badge ${style}`}>
      {status}
    </span>
  );
}
