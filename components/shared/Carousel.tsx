import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
interface CarouselSizeProps {
  array: string[];
}

export function CarouselSize({ array }: CarouselSizeProps) {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full max-w-5xl bg-transparent rounded-lg shadow-lg relative"
    >
      <CarouselContent className="-ml-1">
        {array.map((arr, index) => (
          <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
              <img src={arr} className="w-full h-80 object-cover rounded-lg" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
