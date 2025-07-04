import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wind, Construction, ArrowRight, Phone, BookOpen } from "lucide-react";
import { SERVICE_TYPES } from "@/lib/constants";

const iconMap = {
  wind: Wind,
  construction: Construction,
};

export default function ServiceSelection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Service
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select the appropriate service for your needs. We provide various environmental services 
            to protect air quality in our six-county region.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {SERVICE_TYPES.map((service) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap];
            
            return (
              <Card key={service.value} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-orcaa-blue/10 rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-orcaa-blue" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{service.label}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Link href={`/submit/${service.value.toLowerCase()}`}>
                    <Button className="w-full bg-orcaa-blue hover:bg-orcaa-blue/90 text-white">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 mb-6">
              If you're unsure which service you need or have questions about our processes, 
              our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                className="border-orcaa-blue text-orcaa-blue hover:bg-orcaa-blue hover:text-white"
                onClick={() => window.open('tel:+1-360-539-7610', '_self')}
              >
                <Phone className="mr-2 h-4 w-4" />
                Contact ORCAA
              </Button>
              <Button 
                variant="outline" 
                className="border-orcaa-blue text-orcaa-blue hover:bg-orcaa-blue hover:text-white"
                onClick={() => window.open('https://www.orcaa.org/regulations', '_blank')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View Regulations
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}