import TicketGateScanner from '../../components/TicketGateScanner';

const AdminScanner = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <TicketGateScanner userRole="admin" />
    </div>
  );
};

export default AdminScanner;
