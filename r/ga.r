# Product Detail, Category Listing, Home
# Cart, Search Listing

# install.packages("devtools")

# library(devtools)
# install_github("skardhamar/rga")

library(rga)
rga.open(instance="ga")

route <- function(name, segment) {
  data <- ga$getData(
    87546067, # указываем номер представления
    batch = TRUE,
    walk = TRUE, # TRUE для обхода семплинга и склейки по дням
    start.date = "2018-10-01",
    end.date = "2018-10-13",
    metrics = "ga:pageviews",
    # dimensions = "ga:dimension1,ga:dimension8,ga:landingContentGroup2",
    dimensions = "ga:dimension1,ga:dimension8,ga:contentGroup2",
    segment = segment,
    sort = "ga:dimension1,ga:dimension8",
    filter = "ga:pageviews>0"
  )
  write.table(data, file = paste('results/', name, '.csv', sep=""), row.names=FALSE, sep=",", quote=FALSE)
}

# route('product', "sessions::condition::ga:landingContentGroup2=@Product%20Detail")
# route('catalog', "sessions::condition::ga:landingContentGroup2=@Category%20listing")
# route('home', "sessions::condition::ga:landingContentGroup2=@Home")

route('cart', "sessions::condition::ga:ContentGroup2=@Cart")
route('search', "sessions::condition::ga:ContentGroup2=@Search%20Listing")

'finished'