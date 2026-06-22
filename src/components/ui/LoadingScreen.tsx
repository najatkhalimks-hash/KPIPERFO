export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-um6p-green border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-um6p-navy">Carnet du Chercheur</p>
          <p className="text-xs text-um6p-gray-dark">GSMI | UM6P</p>
        </div>
      </div>
    </div>
  )
}
