task :default => [:build]

task :build do
  cd "src"
  sh "node ../build/r.js -o ../build/build.js out=../massrel.js optimize=none"
  # Can't use r.js wrap because it tries to replace define
  massrel_js = `cat wrap.start.js ../massrel.js wrap.end.js`
  massrel_js_file = File.open(File.join(File.dirname(__FILE__), 'massrel.js'), 'w')
  massrel_js_file.write(massrel_js)
  massrel_js_file.close

  sh "node ../build/r.js -o ../build/build.js out=../massrel.min.js"
  # Can't use r.js wrap because it tries to replace define
  massrel_min_js = `cat wrap.start.js ../massrel.min.js wrap.end.js`
  massrel_min_js_file = File.open(File.join(File.dirname(__FILE__), 'massrel.min.js'), 'w')
  massrel_min_js_file.write(massrel_min_js)
  massrel_min_js_file.close
end

task :package, [:version] => [:pkg, :build] do |t, args|

  def write_pkg_file(filename, dir, version)
    pkg_name = filename.gsub(".js", "." + version + ".js")
    pkg_file = File.open(File.join(dir, pkg_name), "w")

    puts "Building #{pkg_name}..."
    puts "Writing header..."

    header_comment = <<-COMMENT
  /*!
   * massrel/stream-js #{version}
   *
   * Copyright 2013 Mass Relevance
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
    puts filename
    js_file = File.open(File.join(File.dirname(__FILE__), filename), "r")
    pkg_file.write(js_file.read)
    js_file.close

    pkg_file.close

    puts "Done with #{pkg_name}"
  end


  pkg_dir = File.join(File.dirname(__FILE__), "pkg")

  ["massrel.js", "massrel.min.js"].each do |inpath|
    write_pkg_file(inpath, pkg_dir, args.version)
  end
end

