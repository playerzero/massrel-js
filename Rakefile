task :build do
  cd "src"
  sh "node ../build/r.js -o baseUrl=. name=almond.js include=massrel out=../massrel.js wrap=true optimize=none"
  sh "node ../build/r.js -o baseUrl=. name=almond.js include=massrel out=../massrel.min.js wrap=true"
end

task :package, [:version] => [:pkg] do |t, args|
  ["massrel.js", "massrel.min.js"].each do |inpath|
    pkg_name = inpath.gsub(".js", ".#{args.version}.js")
    puts "Building #{pkg_name}..."

    pkg_file = File.open(File.join(File.dirname(__FILE__), "pkg", pkg_name), "w")
    puts "Writing header..."
    header_comment = <<-COMMENT
  /*!
   * massrel/stream-js #{args.version}
   *
   * Copyright 2012 Mass Relevance
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this work except in compliance with the License.
   * You may obtain a copy of the License at:
   *
   *    http://www.apache.org/licenses/LICENSE-2.0
   */
    COMMENT
    pkg_file.write(header_comment)

    puts "Writing library..."
    js_file = File.open(File.join(File.dirname(__FILE__), inpath), "r")
    pkg_file.write(js_file.read)
    js_file.close

    pkg_file.close

    puts "Done with #{pkg_name}"
  end
end
