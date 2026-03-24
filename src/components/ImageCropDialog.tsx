import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, ZoomIn } from "lucide-react";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string;
  aspectRatio?: number; // e.g. 1 for square, 16/9, etc. undefined = free
  onCropped: (blob: Blob) => void;
  onCancel: () => void;
}

function getCroppedBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  rotation: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const cropW = crop.width * scaleX;
  const cropH = crop.height * scaleY;

  canvas.width = cropW;
  canvas.height = cropH;

  ctx.save();
  if (rotation) {
    ctx.translate(cropW / 2, cropH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cropW / 2, -cropH / 2);
  }
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH
  );
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas empty"))),
      "image/png",
      0.92
    );
  });
}

export default function ImageCropDialog({
  open,
  imageSrc,
  aspectRatio,
  onCropped,
  onCancel,
}: ImageCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState([1]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const size = Math.min(width, height, 300);
      setCrop({
        unit: "px",
        x: (width - size) / 2,
        y: (height - size) / 2,
        width: size,
        height: aspectRatio ? size / aspectRatio : size,
      });
    },
    [aspectRatio]
  );

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop, rotation);
    onCropped(blob);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Recortar imagem</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          <div
            className="max-h-[400px] overflow-auto rounded border border-border"
            style={{ transform: `scale(${zoom[0]})`, transformOrigin: "center" }}
          >
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Recorte"
                onLoad={onImageLoad}
                style={{ maxWidth: "100%", transform: `rotate(${rotation}deg)` }}
              />
            </ReactCrop>
          </div>

          <div className="flex items-center gap-4 w-full">
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              value={zoom}
              onValueChange={setZoom}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!completedCrop}>
            Recortar e Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
